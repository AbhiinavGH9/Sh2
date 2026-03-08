import type { Express } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api, ws as wsEvents } from "@shared/routes";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth";
import { z } from "zod";

interface ClientData {
  userId: string;
  name: string;
  avatar?: string;
  frequency: string | null;
  isSpeaking: boolean;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // --- REST API ROUTES ---

  app.get(api.profiles.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    res.json(profile || null);
  });

  app.put(api.profiles.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.profiles.update.input.parse(req.body);
      const updated = await storage.updateProfile(userId, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.groups.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const allGroups = await storage.getGroups();
    // Only fetch public nodes, or nodes owned by the client
    const visibleGroups = allGroups.filter(g => !g.isPrivate || g.creatorId === userId);
    res.json(visibleGroups);
  });

  app.post(api.groups.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const allGroups = await storage.getGroups();
      const ownedGroups = allGroups.filter(g => g.creatorId === userId);

      if (ownedGroups.length >= 3) {
        return res.status(403).json({ message: "Frequency Limit Exceeded: You may only deploy a maximum of 3 active channels." });
      }

      const input = api.groups.create.input.parse(req.body);
      const group = await storage.createGroup({ ...input, creatorId: userId });
      res.status(201).json(group);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/groups/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const groupId = parseInt(req.params.id);
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group designation." });
      }

      const allGroups = await storage.getGroups();
      const group = allGroups.find(g => g.id === groupId);

      if (!group) {
        return res.status(404).json({ message: "Channel not found." });
      }

      if (group.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized. You do not own this frequency." });
      }

      await storage.deleteGroup(groupId);

      // Force anyone actively on this frequency to drop
      broadcastToFrequency(group.frequency, { type: "userLeft", payload: { userId: "SYSTEM" } });
      activeFrequencies.delete(group.frequency);

      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete channel." });
    }
  });

  // Active frequencies state (simple in-memory for this example)
  const activeFrequencies = new Map<string, Set<WebSocket>>();

  app.get(api.frequencies.active.path, isAuthenticated, (req: any, res) => {
    const result = Array.from(activeFrequencies.entries())
      .filter(([_, clients]) => clients.size > 0)
      .map(([frequency, clients]) => ({
        frequency,
        userCount: clients.size
      }));
    res.json(result);
  });


  // --- WEBSOCKET SERVER ---

  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws"
  });

  const clients = new Map<WebSocket, ClientData>();

  function broadcastToFrequency(frequency: string, message: any, excludeWs?: WebSocket) {
    const freqClients = activeFrequencies.get(frequency);
    if (!freqClients) return;

    const msgString = JSON.stringify(message);
    freqClients.forEach(clientWs => {
      if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(msgString);
      }
    });
  }

  function getFrequencyState(frequency: string) {
    const freqClients = activeFrequencies.get(frequency);
    if (!freqClients) return [];

    return Array.from(freqClients).map(ws => {
      const data = clients.get(ws)!;
      return {
        id: data.userId,
        name: data.name,
        isSpeaking: data.isSpeaking,
        avatar: data.avatar
      };
    });
  }

  wss.on("connection", (ws, req) => {
    // In a real app, parse session/cookie from req to authenticate WS
    // For MVP, we will expect the client to send user info when joining

    let clientData: ClientData = {
      userId: `anonymous_${Math.random().toString(36).substring(7)}`,
      name: "Anonymous",
      frequency: null,
      isSpeaking: false
    };

    clients.set(ws, clientData);

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Handle join frequency
        if (message.type === "joinFrequency") {
          const payload = wsEvents.send.joinFrequency.parse(message.payload);
          const newFreq = payload.frequency;

          if (payload.userInfo) {
            clientData.userId = payload.userInfo.id || clientData.userId;
            clientData.name = payload.userInfo.name || clientData.name;
            clientData.avatar = payload.userInfo.avatar || undefined;
          }

          // Leave old frequency
          if (clientData.frequency && clientData.frequency !== newFreq) {
            const oldFreq = clientData.frequency;
            activeFrequencies.get(oldFreq)?.delete(ws);
            broadcastToFrequency(oldFreq, {
              type: "userLeft",
              payload: { userId: clientData.userId }
            });
            broadcastToFrequency(oldFreq, {
              type: "frequencyState",
              payload: {
                frequency: oldFreq,
                users: getFrequencyState(oldFreq)
              }
            });
          }

          // Join new frequency
          clientData.frequency = newFreq;
          if (!activeFrequencies.has(newFreq)) {
            activeFrequencies.set(newFreq, new Set());
          }
          activeFrequencies.get(newFreq)!.add(ws);

          // Notify others in new frequency
          broadcastToFrequency(newFreq, {
            type: "userJoined",
            payload: { userId: clientData.userId, name: clientData.name, avatar: clientData.avatar }
          }, ws);

          // Send current state to the joining user
          ws.send(JSON.stringify({
            type: "frequencyState",
            payload: {
              frequency: newFreq,
              users: getFrequencyState(newFreq)
            }
          }));

          // Also broadcast the full state update so everyone's list updates reliably
          broadcastToFrequency(newFreq, {
            type: "frequencyState",
            payload: {
              frequency: newFreq,
              users: getFrequencyState(newFreq)
            }
          });
        }

        // Handle leave frequency
        else if (message.type === "leaveFrequency") {
          if (clientData.frequency) {
            const oldFreq = clientData.frequency;
            activeFrequencies.get(oldFreq)?.delete(ws);

            clientData.frequency = null;

            broadcastToFrequency(oldFreq, {
              type: "userLeft",
              payload: { userId: clientData.userId }
            });
            broadcastToFrequency(oldFreq, {
              type: "frequencyState",
              payload: {
                frequency: oldFreq,
                users: getFrequencyState(oldFreq)
              }
            });
          }
        }

        // Handle speaking status
        else if (message.type === "speaking") {
          if (!clientData.frequency) return;
          const payload = wsEvents.send.speaking.parse(message.payload);
          clientData.isSpeaking = payload.isSpeaking;

          broadcastToFrequency(clientData.frequency, {
            type: "userSpeaking",
            payload: { userId: clientData.userId, isSpeaking: clientData.isSpeaking }
          });
        }

        // Handle WebRTC signaling
        else if (message.type === "webrtcSignal") {
          if (!clientData.frequency) return;
          const payload = wsEvents.send.webrtcSignal.parse(message.payload);

          const signalMessage = {
            type: "webrtcSignal",
            payload: {
              fromUserId: clientData.userId,
              signalData: payload.signalData
            }
          };

          if (payload.targetUserId) {
            // Unicast to specific user
            const freqClients = activeFrequencies.get(clientData.frequency);
            if (freqClients) {
              const clientsArray = Array.from(freqClients);
              for (let i = 0; i < clientsArray.length; i++) {
                const clientWs = clientsArray[i];
                const targetData = clients.get(clientWs);
                if (targetData && targetData.userId === payload.targetUserId && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify(signalMessage));
                  break;
                }
              }
            }
          } else {
            // Broadcast
            broadcastToFrequency(clientData.frequency, signalMessage, ws);
          }
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    });

    ws.on("close", () => {
      if (clientData.frequency) {
        const freq = clientData.frequency;
        activeFrequencies.get(freq)?.delete(ws);

        broadcastToFrequency(freq, {
          type: "userLeft",
          payload: { userId: clientData.userId }
        });

        broadcastToFrequency(freq, {
          type: "frequencyState",
          payload: {
            frequency: freq,
            users: getFrequencyState(freq)
          }
        });

        if (activeFrequencies.get(freq)?.size === 0) {
          activeFrequencies.delete(freq);
        }
      }
      clients.delete(ws);
    });
  });

  return httpServer;
}
