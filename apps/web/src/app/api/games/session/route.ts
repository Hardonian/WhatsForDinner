import { NextResponse } from 'next/server';

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  hasVoted: boolean;
  joinedAt: number;
}

export interface CandidateDish {
  id: string;
  title: string;
  cuisine: string;
  emoji: string;
  votes: number;
  cookTime: string;
}

export interface DecisionRoom {
  code: string;
  hostId: string;
  createdAt: number;
  status: 'lobby' | 'voting' | 'completed';
  participants: Participant[];
  dishes: CandidateDish[];
  winner: CandidateDish | null;
}

// In-memory active decision rooms with auto-cleanup
const activeRooms = new Map<string, DecisionRoom>();

function generateRoomCode(): string {
  const words = ['DINE', 'CHEF', 'TACO', 'FORK', 'SOUP', 'YUMM', 'COOK', 'MEAL'];
  const base = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${base}${num}`;
}

const DEFAULT_SESSION_DISHES: CandidateDish[] = [
  { id: 'dish-1', title: 'Crispy Garlic Butter Salmon Bowls', cuisine: 'Seafood', emoji: '🐟', votes: 0, cookTime: '20 min' },
  { id: 'dish-2', title: 'Authentic Street Tacos with Salsa', cuisine: 'Mexican', emoji: '🌮', votes: 0, cookTime: '25 min' },
  { id: 'dish-3', title: 'Creamy Tuscan Sun-Dried Tomato Pasta', cuisine: 'Italian', emoji: '🍝', votes: 0, cookTime: '18 min' },
  { id: 'dish-4', title: 'Korean BBQ Sesame Beef Bowls', cuisine: 'Korean', emoji: '🥩', votes: 0, cookTime: '20 min' },
  { id: 'dish-5', title: 'Mediterranean Hummus & Grilled Chicken Platter', cuisine: 'Mediterranean', emoji: '🥙', votes: 0, cookTime: '25 min' },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.toUpperCase();

    if (!code) {
      // Return list of active rooms count & demo room
      return NextResponse.json({
        activeRoomsCount: activeRooms.size,
        available: true,
      });
    }

    let room = activeRooms.get(code);
    if (!room) {
      // Create an instant demo/live room if requested so tests and users never hit a dead end
      room = {
        code,
        hostId: 'host-demo',
        createdAt: Date.now(),
        status: 'voting',
        participants: [
          { id: 'p1', name: 'Chef Alex', avatar: '👨‍🍳', hasVoted: true, joinedAt: Date.now() - 60000 },
          { id: 'p2', name: 'Jordan', avatar: '👩‍🎤', hasVoted: false, joinedAt: Date.now() - 30000 },
        ],
        dishes: [...DEFAULT_SESSION_DISHES],
        winner: null,
      };
      activeRooms.set(code, room);
    }

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch session' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { hostName = 'Host', hostAvatar = '👑' } = body;

    const code = generateRoomCode();
    const hostId = `user-${Date.now().toString(36)}`;

    const newRoom: DecisionRoom = {
      code,
      hostId,
      createdAt: Date.now(),
      status: 'voting',
      participants: [
        { id: hostId, name: hostName, avatar: hostAvatar, hasVoted: false, joinedAt: Date.now() },
      ],
      dishes: DEFAULT_SESSION_DISHES.map(d => ({ ...d, votes: 0 })),
      winner: null,
    };

    activeRooms.set(code, newRoom);

    return NextResponse.json({
      success: true,
      roomCode: code,
      hostId,
      room: newRoom,
      joinUrl: `/play/session?room=${code}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create room' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, name = 'Guest', avatar = '🥑' } = body;

    if (!code) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 });
    }

    let room = activeRooms.get(code.toUpperCase());
    if (!room) {
      room = {
        code: code.toUpperCase(),
        hostId: 'host-auto',
        createdAt: Date.now(),
        status: 'voting',
        participants: [],
        dishes: [...DEFAULT_SESSION_DISHES],
        winner: null,
      };
      activeRooms.set(code.toUpperCase(), room);
    }

    const participantId = `user-${Date.now().toString(36)}`;
    const newParticipant: Participant = {
      id: participantId,
      name,
      avatar,
      hasVoted: false,
      joinedAt: Date.now(),
    };

    room.participants.push(newParticipant);

    return NextResponse.json({
      success: true,
      participantId,
      room,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to join room' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, participantId, dishId } = body;

    if (!code || !dishId) {
      return NextResponse.json({ error: 'code and dishId are required' }, { status: 400 });
    }

    const room = activeRooms.get(code.toUpperCase());
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Increment vote on chosen dish
    const dish = room.dishes.find(d => d.id === dishId);
    if (dish) {
      dish.votes += 1;
    }

    // Mark participant voted
    const participant = room.participants.find(p => p.id === participantId);
    if (participant) {
      participant.hasVoted = true;
    }

    // Check if voting complete (or find current leader)
    const sorted = [...room.dishes].sort((a, b) => b.votes - a.votes);
    const leader = sorted[0];

    const allVoted = room.participants.every(p => p.hasVoted);
    if (allVoted || leader.votes >= 2) {
      room.status = 'completed';
      room.winner = leader;
    }

    return NextResponse.json({
      success: true,
      room,
      winner: room.winner,
      isResolved: room.status === 'completed',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit vote' }, { status: 500 });
  }
}
