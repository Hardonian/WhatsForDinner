// @ts-nocheck
import { GET as spinGet, POST as spinPost } from '../spin-wheel/route';
import { GET as duelGet, POST as duelPost } from '../duel/route';
import { GET as mysteryGet, POST as mysteryPost } from '../mystery-ingredient/route';
import { GET as quickGet, POST as quickPost } from '../quick-pick/route';
import { GET as swipeGet, POST as swipePost } from '../swipe/route';
import { GET as sessionGet, POST as sessionPost, PUT as sessionPut, PATCH as sessionPatch } from '../session/route';

describe('Decision Games API Routes', () => {
  describe('Spin the Wheel API', () => {
    it('should return categories on GET', async () => {
      const req = new Request('http://localhost:3000/api/games/spin-wheel');
      const res = await spinGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.categories.length).toBeGreaterThan(0);
      expect(data.rules.xpReward).toBe(25);
    });

    it('should filter vegetarian categories on GET', async () => {
      const req = new Request('http://localhost:3000/api/games/spin-wheel?dietary=vegetarian');
      const res = await spinGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.categories.length).toBeGreaterThan(0);
    });

    it('should generate spin result on POST', async () => {
      const req = new Request('http://localhost:3000/api/games/spin-wheel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: 'quick-easy' }),
      });
      const res = await spinPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.recipe.title).toBeDefined();
      expect(data.xpEarned).toBe(25);
    });
  });

  describe('Dinner Duel API', () => {
    it('should return 2 competing options on GET', async () => {
      const req = new Request('http://localhost:3000/api/games/duel?round=1');
      const res = await duelGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.optionA).toBeDefined();
      expect(data.optionB).toBeDefined();
      expect(data.optionA.id).not.toBe(data.optionB.id);
    });

    it('should return tournament bracket matchups on GET', async () => {
      const req = new Request('http://localhost:3000/api/games/duel?mode=bracket');
      const res = await duelGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.mode).toBe('bracket');
      expect(data.matchups.length).toBe(4);
    });

    it('should record duel vote on POST', async () => {
      const req = new Request('http://localhost:3000/api/games/duel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId: 'duel-1', round: 1, isFinal: false }),
      });
      const res = await duelPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.winner.id).toBe('duel-1');
      expect(data.xpAwarded).toBe(10);
    });
  });

  describe('Mystery Ingredient API', () => {
    it('should return mystery boxes on GET', async () => {
      const res = await mysteryGet();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.boxes.length).toBeGreaterThan(0);
      expect(data.boxes[0].boxNumber).toBe(1);
    });

    it('should reveal secret ingredient and recipe on POST', async () => {
      const req = new Request('http://localhost:3000/api/games/mystery-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId: 'gochujang' }),
      });
      const res = await mysteryPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.revealed).toBe(true);
      expect(data.ingredient.name).toBe('Korean Gochujang');
      expect(data.xpEarned).toBe(30);
    });
  });

  describe('Quick Pick API', () => {
    it('should return factors on GET', async () => {
      const res = await quickGet();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.factors.length).toBe(3);
    });

    it('should compute recommendation based on factors on POST', async () => {
      const req = new Request('http://localhost:3000/api/games/quick-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time: '15m', craving: 'comfort', effort: 'one-pot' }),
      });
      const res = await quickPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.recipe.title).toContain('Tortellini');
      expect(data.xpEarned).toBe(20);
    });
  });

  describe('Dinner Swipe API', () => {
    it('should return deck of cards on GET', async () => {
      const req = new Request('http://localhost:3000/api/games/swipe?limit=4');
      const res = await swipeGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.cards.length).toBe(4);
    });

    it('should record swipe action on POST', async () => {
      const req = new Request('http://localhost:3000/api/games/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'swipe-1', action: 'like' }),
      });
      const res = await swipePost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe('like');
    });
  });

  describe('Group Decision Multiplayer Session API', () => {
    let createdRoomCode = '';
    let hostId = '';
    let guestId = '';

    it('should create a room on POST', async () => {
      const req = new Request('http://localhost:3000/api/games/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: 'HostAlex', hostAvatar: '👑' }),
      });
      const res = await sessionPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.roomCode).toBeDefined();
      createdRoomCode = data.roomCode;
      hostId = data.hostId;
    });

    it('should join an existing room on PUT', async () => {
      const req = new Request('http://localhost:3000/api/games/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: createdRoomCode, name: 'GuestSam', avatar: '🍕' }),
      });
      const res = await sessionPut(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      guestId = data.participantId;
      expect(data.room.participants.length).toBe(2);
    });

    it('should get room status on GET', async () => {
      const req = new Request(`http://localhost:3000/api/games/session?code=${createdRoomCode}`);
      const res = await sessionGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.room.code).toBe(createdRoomCode);
      expect(data.room.dishes.length).toBeGreaterThan(0);
    });

    it('should vote on dishes on PATCH', async () => {
      const req = new Request('http://localhost:3000/api/games/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: createdRoomCode,
          participantId: hostId,
          dishId: 'dish-1',
        }),
      });
      const res = await sessionPatch(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      const votedDish = data.room.dishes.find(d => d.id === 'dish-1');
      expect(votedDish.votes).toBe(1);
    });
  });
});
