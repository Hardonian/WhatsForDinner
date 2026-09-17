/**
 * Household Kitchen Multiplayer Realtime Sync Engine
 * Synchronizes multi-device cooking rooms, timers, and multi-course dining coordination
 * across family members (e.g. Cook A on Main Course, Cook B on Dessert).
 */

export interface KitchenParticipant {
  id: string;
  name: string;
  role: 'head-chef' | 'sous-chef' | 'prep-cook' | 'pastry';
  currentRecipeId?: string;
  currentStepIndex: number;
  activeTimersCount: number;
  lastPing: number;
}

export interface SharedKitchenRoom {
  roomCode: string;
  hostId: string;
  mealTitle: string;
  targetServingTime: string;
  participants: KitchenParticipant[];
  sharedTimers: Array<{
    id: string;
    label: string;
    totalSeconds: number;
    remainingSeconds: number;
    assignedToName: string;
    isFinished: boolean;
  }>;
}

type RoomListener = (room: SharedKitchenRoom) => void;

class HouseholdRealtimeSync {
  private room: SharedKitchenRoom | null = null;
  private listeners: Set<RoomListener> = new Set();
  private timerTicker: NodeJS.Timeout | null = null;

  /**
   * Create or join a live synchronized kitchen cooking room
   */
  public joinRoom(roomCode: string, participantName: string, role: KitchenParticipant['role'] = 'sous-chef'): SharedKitchenRoom {
    const participant: KitchenParticipant = {
      id: Math.random().toString(36).substring(2, 9),
      name: participantName,
      role,
      currentStepIndex: 0,
      activeTimersCount: 1,
      lastPing: Date.now(),
    };

    if (!this.room || this.room.roomCode !== roomCode) {
      this.room = {
        roomCode: roomCode.toUpperCase(),
        hostId: participant.id,
        mealTitle: 'Family Dinner Coordination',
        targetServingTime: '7:30 PM',
        participants: [participant],
        sharedTimers: [
          {
            id: 'timer-main-01',
            label: 'Salmon Resting Rest Period',
            totalSeconds: 180,
            remainingSeconds: 180,
            assignedToName: participantName,
            isFinished: false,
          },
        ],
      };
    } else {
      const existing = this.room.participants.find(p => p.name === participantName);
      if (!existing) {
        this.room.participants.push(participant);
      }
    }

    this.startTicker();
    this.notify();
    return this.room;
  }

  /**
   * Add a synchronized kitchen timer visible on all household devices
   */
  public broadcastTimer(label: string, seconds: number, authorName: string) {
    if (!this.room) return;

    this.room.sharedTimers.push({
      id: `timer-${Date.now()}`,
      label,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      assignedToName: authorName,
      isFinished: false,
    });

    this.notify();
  }

  public subscribe(listener: RoomListener): () => void {
    this.listeners.add(listener);
    if (this.room) listener(this.room);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    if (!this.room) return;
    this.listeners.forEach(cb => cb(this.room!));
  }

  private startTicker() {
    if (this.timerTicker) return;

    this.timerTicker = setInterval(() => {
      if (!this.room) return;

      let changed = false;
      this.room.sharedTimers.forEach(t => {
        if (t.remainingSeconds > 0) {
          t.remainingSeconds -= 1;
          changed = true;
          if (t.remainingSeconds === 0) {
            t.isFinished = true;
          }
        }
      });

      if (changed) {
        this.notify();
      }
    }, 1000);
  }

  public leaveRoom() {
    if (this.timerTicker) {
      clearInterval(this.timerTicker);
      this.timerTicker = null;
    }
    this.room = null;
    this.listeners.clear();
  }
}

export const householdRealtimeSync = new HouseholdRealtimeSync();
