import { create } from "zustand";
import { commands, IChat } from "../../common/commands";
import { nanoid } from "nanoid";

export interface IMedia {
  id: number;
  title: string;
  artist: string;
  album: string;
  thumbnail: number[];
}

interface IChatStore {
  chatId: string | null;
  initialMessages: any[];
  pendingMessage: string | null;
  chats: IChat[];
  openDrawer: boolean;
  setOpenDrawer: (value: boolean) => void;
  updateChatName: (id: string, name: string) => void;
  loadChat: (id?: string) => Promise<void>;
  getAllChats: () => Promise<void>;
  getMediaMetadata: (id: number) => Promise<IMedia | null>;
  mediaCache: Record<number, IMedia>;
}

export const useChatStore = create<IChatStore>((set, get) => ({
  chatId: null,
  initialMessages: [],
  pendingMessage: null,
  chats: [],
  openDrawer: false,
  setOpenDrawer(value) {
    set({ openDrawer: value });
  },
  updateChatName(id, name) {
    const chats = get().chats;
    const chat = chats.find((v) => v.id === id);
    if (chat) {
      chat.name = name;
      set({ chats });
    }
  },
  async loadChat(id) {
    try {
      let chatId = id || "";
      if (!id) {
        chatId = nanoid();
        await commands.createChat({
          input: {
            id: chatId,
            name: chatId,
            data: {},
          },
        });
        await get().getAllChats();
      }
      const chatMessages = await commands.loadChat({ chatId });
      const messages = chatMessages.map((msg) => msg.content);
      set({
        initialMessages: messages,
        chatId,
      });
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  },
  async getAllChats() {
    try {
      const chats = await commands.getAllChats();
      set({ chats });
    } catch (error) {
      console.error("Error fetching chats:", error);
      set({ chats: [] });
    }
  },
  async getMediaMetadata(id) {
    try {
      const cachedMedia = get().mediaCache[id];
      if (cachedMedia) {
        return cachedMedia;
      }
      const media = await commands.getMediaMetadata({ mediaId: id });
      if (media) {
        const mediaCache = get().mediaCache;
        mediaCache[id] = media;
        set({ mediaCache });
        return media;
      }
      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  mediaCache: {},
}));
