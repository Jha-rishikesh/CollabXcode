import { create } from 'zustand';

const useAppStore = create((set) => ({
    username: '',
    isGuest: true,
    roomId: '',
    savedRooms: [],
    
    setUsername: (name) => set({ username: name }),
    setIsGuest: (status) => set({ isGuest: status }),
    setRoomId: (id) => set({ roomId: id }),
    setSavedRooms: (rooms) => set({ savedRooms: rooms }),
    clearAuth: () => set({ username: '', isGuest: true, savedRooms: [], roomId: '' })
}));

export default useAppStore;
