# -*- coding: utf-8 -*-
import re
import sys

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

# 1. Fix ChatScreen.tsx
print("1. Fixing ChatScreen.tsx...")
with open(r'd:\NewFolder\Ask\Ask\illiniguide---uiuc-knowledge-base\components\ChatScreen.tsx', 'r', encoding='utf-8') as f:
    chat_content = f.read()

# Fix EMPTY message issue
chat_content = chat_content.replace(
    '''// Save AI message if we have a conversation
         if (user && conversationId) {
            try {
               await conversationService.saveMessage(conversationId, aiMsg);''',
    '''// Save AI message if we have a conversation and message has content
         if (user && conversationId && aiMsg.text && aiMsg.text.trim()) {
            try {
               await conversationService.saveMessage(conversationId, aiMsg);'''
)

# Add smart title function
smart_title = '''
   // Generate smart conversation title
   const generateSmartTitle = (text: string): string => {
      let title = text
         .replace(/^(请|帮我|帮忙|能否|可以|how to|please|help me)/i, '')
         .trim();
      
      if (title.includes('?') || title.includes('？')) {
         title = title.split(/[?？]/)[0].trim();
      }
      
      if (title.length > 30) {
         title = title.substring(0, 27) + '...';
      }
      
      return title || '新对话';
   };
'''

chat_content = chat_content.replace(
    '   const t = UI_TEXT[language];',
    smart_title + '\n   const t = UI_TEXT[language];'
)

chat_content = chat_content.replace(
    "title: text.slice(0, 50)",
    "title: generateSmartTitle(text)"
)

# Add cleanup call
chat_content = chat_content.replace(
    '''if (user && !conversationId) {
            const { data } = await conversationService.createConversation(''',
    '''if (user && !conversationId) {
            await conversationService.checkAndCleanupOldConversations(100);
            const { data } = await conversationService.createConversation('''
)

with open(r'd:\NewFolder\Ask\Ask\illiniguide---uiuc-knowledge-base\components\ChatScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(chat_content)

print("   [OK] Fixed EMPTY messages")
print("   [OK] Added smart titles")
print("   [OK] Added cleanup call")

# 2. Fix conversationService.ts
print("\n2. Fixing conversationService.ts...")
with open(r'd:\NewFolder\Ask\Ask\illiniguide---uiuc-knowledge-base\services\conversationService.ts', 'r', encoding='utf-8') as f:
    service_content = f.read()

cleanup_fn = '''
    /**
     * Check and cleanup old conversations if limit exceeded
     */
    async checkAndCleanupOldConversations(maxConversations: number = 100) {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const { count } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (count && count >= maxConversations) {
            const toDelete = count - maxConversations + 1;
            
            const { data: oldConversations } = await supabase
                .from('conversations')
                .select('id')
                .eq('user_id', user.id)
                .eq('is_pinned', false)
                .order('updated_at', { ascending: true })
                .limit(toDelete);

            if (oldConversations && oldConversations.length > 0) {
                const idsToDelete = oldConversations.map(c => c.id);
                await supabase
                    .from('conversations')
                    .delete()
                    .in('id', idsToDelete);
            }
        }

        return { count };
    },

'''

service_content = service_content.replace(
    '    /**\n     * Convert Supabase messages to ChatMessage format\n     */',
    cleanup_fn + '    /**\n     * Convert Supabase messages to ChatMessage format\n     */'
)

# Enhanced security
service_content = service_content.replace(
    '''async getConversation(conversationId: string) {
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single();

        if (convError) return { data: null, error: convError };''',
    '''async getConversation(conversationId: string) {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .eq('user_id', user.id)
            .single();

        if (convError || !conversation) {
            return { data: null, error: convError || new Error('Access denied') };
        }'''
)

with open(r'd:\NewFolder\Ask\Ask\illiniguide---uiuc-knowledge-base\services\conversationService.ts', 'w', encoding='utf-8') as f:
    f.write(service_content)

print("   [OK] Added cleanup function")
print("   [OK] Enhanced security")

# 3. Fix App.tsx
print("\n3. Fixing App.tsx...")
with open(r'd:\NewFolder\Ask\Ask\illiniguide---uiuc-knowledge-base\App.tsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

load_last = '''
   // Load last conversation on mount
   useEffect(() => {
      const lastId = localStorage.getItem('lastConversationId');
      if (lastId && !isGuest) {
         setCurrentConversationId(lastId);
      }
   }, [isGuest]);

'''

app_content = app_content.replace(
    "const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);",
    "const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);\n" + load_last
)

app_content = app_content.replace(
    '''const handleSelectConversation = (conversationId: string | null) => {
      setCurrentConversationId(conversationId);
   };''',
    '''const handleSelectConversation = (conversationId: string | null) => {
      setCurrentConversationId(conversationId);
      if (conversationId) {
         localStorage.setItem('lastConversationId', conversationId);
      } else {
         localStorage.removeItem('lastConversationId');
      }
   };'''
)

with open(r'd:\NewFolder\Ask\Ask\illiniguide---uiuc-knowledge-base\App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_content)

print("   [OK] Added auto-load last conversation")

print("\n" + "="*50)
print("All optimizations completed!")
print("="*50)
print("\nSummary:")
print("1. EMPTY messages fixed")
print("2. Smart title generation added")
print("3. Conversation limit (100 max)")
print("4. Enhanced security checks")
print("5. Auto-load last conversation")
