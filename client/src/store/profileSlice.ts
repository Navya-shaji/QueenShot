import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ProfileState {
  id: string | null;
  username: string;
  email: string;
  avatarUrl: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  eloRating: number;
  coinsCollected: number;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  id: null,
  username: '',
  email: '',
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=DefaultStriker',
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  eloRating: 1200,
  coinsCollected: 0,
  loading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (userId: string) => {
    // Replace with actual API call once connected to backend
    // const response = await fetch(`http://localhost:3000/api/users/${userId}`);
    // return (await response.json()).data;
    
    // Mock response for now
    return new Promise<Partial<ProfileState>>((resolve) => {
      setTimeout(() => {
        resolve({
          id: userId,
          username: `Player_${userId.slice(-4)}`,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=Player_${userId.slice(-4)}`,
          gamesPlayed: 12,
          gamesWon: 7,
          gamesLost: 5,
          eloRating: 1350,
          coinsCollected: 450,
        });
      }, 500);
    });
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    updateProfileLocally: (state, action: PayloadAction<Partial<ProfileState>>) => {
      return { ...state, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        return { ...state, ...action.payload, loading: false };
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profile';
      });
  },
});

export const { updateProfileLocally } = profileSlice.actions;
export default profileSlice.reducer;
