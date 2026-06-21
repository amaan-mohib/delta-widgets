import { create } from "zustand";
import { commands, IChat } from "../../common/commands";
import { nanoid } from "nanoid";

interface IChatStore {
  chatId: string | null;
  initialMessages: any[];
  isNewChat: boolean;
  chats: IChat[];
  openDrawer: boolean;
  setOpenDrawer: (value: boolean) => void;
  updateChatName: (id: string, name: string) => void;
  loadChat: (id?: string) => Promise<void>;
  getAllChats: () => Promise<void>;
}

export const useChatStore = create<IChatStore>((set, get) => ({
  chatId: null,
  initialMessages: [],
  isNewChat: false,
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
        isNewChat: !id,
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
}));
