import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

const API = 'http://localhost:4000';

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
  winRatio: number;
  loading: boolean;
  saving: boolean;
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
  winRatio: 0,
  loading: false,
  saving: false,
  error: null,
};

// Fetch the authenticated user's profile from the backend
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (token: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.error || 'Failed to fetch profile.');
      }
      return data.data as Partial<ProfileState>;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error fetching profile.');
    }
  }
);

// Update username and/or avatarUrl
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (
    { token, username, avatarUrl }: { token: string; username?: string; avatarUrl?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.error || 'Failed to update profile.');
      }
      return data.data as Partial<ProfileState>;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error updating profile.');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
    updateProfileLocally: (state, action: PayloadAction<Partial<ProfileState>>) => {
      return { ...state, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // fetchProfile
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
        state.error = action.payload as string;
      });

    // updateProfile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        return { ...state, ...action.payload, saving: false };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearProfileError, updateProfileLocally } = profileSlice.actions;
export default profileSlice.reducer;
