/**
 * Mock data — field names exactly match the DRF API contract (API_REFERENCE.txt).
 * Used as a fallback when the backend is unreachable during development.
 */

import type { Event, LeaderboardEntry, ShopItem, PointsData } from '@/lib/types';

export const MOCK_EVENTS: Event[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'HackXIIT 2026',
    type: 'cocurricular',
    organized_by: 'Programming Club',
    date: '2026-03-15',
    location: 'LHC Auditorium, Block A',
    points_per_participant: 50,
    winner_points: 200,
    winners_roll_nos: [],
    created_by: { id: 'org1', roll_no: 'ORG001', name: 'Programming Club', email: 'prog@uni.edu', role: 'organizer' },
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Culturals Night 2026',
    type: 'extracurricular',
    organized_by: 'Cultural Council',
    date: '2026-03-20',
    location: 'Main Ground',
    points_per_participant: 30,
    winner_points: 100,
    winners_roll_nos: [],
    created_by: { id: 'org2', roll_no: 'ORG002', name: 'Cultural Council', email: 'cult@uni.edu', role: 'organizer' },
    created_at: '2026-01-12T09:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Inter-Hostel Basketball',
    type: 'extracurricular',
    organized_by: 'Sports Committee',
    date: '2026-03-25',
    location: 'Sports Complex, Court 1',
    points_per_participant: 35,
    winner_points: 150,
    winners_roll_nos: [],
    created_by: { id: 'org3', roll_no: 'ORG003', name: 'Sports Committee', email: 'sports@uni.edu', role: 'organizer' },
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'Research Paper Symposium',
    type: 'academic',
    organized_by: 'Research Cell',
    date: '2026-04-01',
    location: 'Seminar Hall 101',
    points_per_participant: 25,
    winner_points: 75,
    winners_roll_nos: [],
    created_by: { id: 'org4', roll_no: 'ORG004', name: 'Research Cell', email: 'research@uni.edu', role: 'organizer' },
    created_at: '2026-01-18T11:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'Machine Learning Workshop',
    type: 'academic',
    organized_by: 'AI Club',
    date: '2026-03-18',
    location: 'CS Lab 301',
    points_per_participant: 20,
    winner_points: 50,
    winners_roll_nos: [],
    created_by: { id: 'org5', roll_no: 'ORG005', name: 'AI Club', email: 'ai@uni.edu', role: 'organizer' },
    created_at: '2026-01-20T12:00:00Z',
  },
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  // Year 1
  { id: 'u1',  roll_no: 'CS23B001', name: 'Aryan Sharma',   branch: 'CSE', year: 1, total_points: 320 },
  { id: 'u2',  roll_no: 'EE23B045', name: 'Priya Mehta',    branch: 'EEE', year: 1, total_points: 285 },
  { id: 'u3',  roll_no: 'ME23B012', name: 'Rohan Gupta',    branch: 'ME',  year: 1, total_points: 240 },
  { id: 'u4',  roll_no: 'CH23B023', name: 'Ananya Patel',   branch: 'CH',  year: 1, total_points: 195 },
  { id: 'u5',  roll_no: 'PH23B034', name: 'Vikram Singh',   branch: 'PH',  year: 1, total_points: 150 },
  // Year 2
  { id: 'u6',  roll_no: 'CS22B007', name: 'Kavya Nair',     branch: 'CSE', year: 2, total_points: 410 },
  { id: 'u7',  roll_no: 'EE22B019', name: 'Aditya Kumar',   branch: 'EEE', year: 2, total_points: 380 },
  { id: 'u8',  roll_no: 'MA22B033', name: 'Meera Krishnan', branch: 'MA',  year: 2, total_points: 325 },
  { id: 'u9',  roll_no: 'CE22B045', name: 'Rahul Joshi',    branch: 'CE',  year: 2, total_points: 290 },
  { id: 'u10', roll_no: 'BT22B052', name: 'Sneha Iyer',     branch: 'BT',  year: 2, total_points: 245 },
  // Year 3
  { id: 'u11', roll_no: 'CS21B003', name: 'Aarav Malhotra', branch: 'CSE', year: 3, total_points: 520 },
  { id: 'u12', roll_no: 'EE21B018', name: 'Diya Sharma',    branch: 'EEE', year: 3, total_points: 475 },
  { id: 'u13', roll_no: 'ME21B029', name: 'Kiran Reddy',    branch: 'ME',  year: 3, total_points: 430 },
  { id: 'u14', roll_no: 'CH21B037', name: 'Pooja Patel',    branch: 'CH',  year: 3, total_points: 385 },
  { id: 'u15', roll_no: 'CS21B046', name: 'Sai Prasad',     branch: 'CSE', year: 3, total_points: 340 },
  // Year 4
  { id: 'u16', roll_no: 'CS20B002', name: 'Raghav Kapoor',  branch: 'CSE', year: 4, total_points: 680 },
  { id: 'u17', roll_no: 'EE20B015', name: 'Nisha Bose',     branch: 'EEE', year: 4, total_points: 625 },
  { id: 'u18', roll_no: 'ME20B028', name: 'Arjun Menon',    branch: 'ME',  year: 4, total_points: 580 },
  { id: 'u19', roll_no: 'MA20B041', name: 'Lakshmi Rao',    branch: 'MA',  year: 4, total_points: 535 },
  { id: 'u20', roll_no: 'CE20B054', name: 'Vivek Tiwari',   branch: 'CE',  year: 4, total_points: 490 },
];

export const MOCK_SHOP_ITEMS: ShopItem[] = [
  { id: '1',  name: 'CampusEngage T-Shirt',       description: 'Official branded t-shirt. Available in S/M/L/XL.',          points_cost: 200, category: 'Merchandise', stock: 50  },
  { id: '2',  name: 'Branded Water Bottle',        description: 'Stainless steel water bottle with campus logo.',             points_cost: 150, category: 'Merchandise', stock: 30  },
  { id: '3',  name: 'Campus Notebook',             description: 'A5 ruled notebook with CampusEngage branding.',             points_cost: 75,  category: 'Merchandise', stock: 100 },
  { id: '4',  name: 'Lanyard + ID Holder',         description: 'Retractable lanyard with transparent ID card holder.',      points_cost: 50,  category: 'Merchandise', stock: 75  },
  { id: '5',  name: 'Canteen Coupon ₹100',         description: '₹100 off your next canteen bill. Valid 30 days.',           points_cost: 100, category: 'Discounts',   stock: 200 },
  { id: '6',  name: 'Canteen Coupon ₹50',          description: '₹50 off your next canteen bill. Valid 30 days.',            points_cost: 50,  category: 'Discounts',   stock: 500 },
  { id: '7',  name: 'Bookstore 20% Off',           description: '20% discount on any one purchase at the campus bookstore.', points_cost: 80,  category: 'Discounts',   stock: 50  },
  { id: '8',  name: 'Priority Event Registration', description: 'Skip the queue — register for any event 24 hrs early.',    points_cost: 300, category: 'Experiences', stock: 20  },
  { id: '9',  name: 'Mentorship Session',          description: '1-hour mentorship session with a verified alumni.',         points_cost: 400, category: 'Experiences', stock: 10  },
  { id: '10', name: 'Lunch with Faculty',          description: 'Lunch with a faculty member of your choice.',              points_cost: 500, category: 'Experiences', stock: 5   },
];

export const MOCK_POINTS: PointsData = {
  total_points: 150,
  ledger: [
    {
      id: 'l1', event: '550e8400-e29b-41d4-a716-446655440001',
      event_title: 'HackXIIT 2026',         entry_type: 'credit', points: 50,
      reason: 'Participation via attendance', source: 'attendance', created_at: '2026-02-25T10:00:00Z',
    },
    {
      id: 'l2', event: '550e8400-e29b-41d4-a716-446655440002',
      event_title: 'Culturals Night 2026',   entry_type: 'credit', points: 30,
      reason: 'Participation via attendance', source: 'attendance', created_at: '2026-02-20T12:00:00Z',
    },
    {
      id: 'l3', event: '550e8400-e29b-41d4-a716-446655440003',
      event_title: 'Inter-Hostel Basketball', entry_type: 'credit', points: 35,
      reason: 'Participation via attendance', source: 'attendance', created_at: '2026-02-15T08:00:00Z',
    },
    {
      id: 'l4', event: '550e8400-e29b-41d4-a716-446655440001',
      event_title: 'HackXIIT 2026',          entry_type: 'credit', points: 200,
      reason: 'Winner of HackXIIT 2026',      source: 'winner',     created_at: '2026-02-25T18:00:00Z',
    },
  ],
};
