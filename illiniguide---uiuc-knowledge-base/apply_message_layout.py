import re

# Read the file
with open(r'd:\NewFolder\Ask\Ask\illiniguide---uiuc-knowledge-base\components\ChatScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Modification 1: Add flex-row-reverse for user messages
content = content.replace(
    '<div className={`${containerClass} flex gap-4`}>',
    '<div className={`${containerClass} flex gap-4 ${msg.role === \'user\' ? \'flex-row-reverse\' : \'\'}`}>'
)

# Modification 2: Update user avatar
content = content.replace(
    '''<div className="w-6 h-6 bg-slate-200 rounded-sm flex items-center justify-center text-slate-500 text-xs">
                                        👤
                                     </div>''',
    '''<div className="w-6 h-6 bg-gradient-to-br from-illini-blue to-illini-orange rounded-sm flex items-center justify-center text-white text-xs font-semibold">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                     </div>'''
)

# Modification 3: Add items-end for user message container
content = content.replace(
    '<div className="relative flex-1 overflow-hidden pt-0.5">',
    '<div className={`relative flex-1 overflow-hidden pt-0.5 ${msg.role === \'user\' ? \'flex flex-col items-end\' : \'\'}`}>'
)

# Modification 4: Add text-right for user message label
content = content.replace(
    '''<div className="font-semibold text-xs text-slate-900 mb-1">
                                     {msg.role === 'user' ? t.userRole : t.botName}
                                  </div>''',
    '''<div className={`font-semibold text-xs text-slate-900 mb-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                                     {msg.role === 'user' ? t.userRole : t.botName}
                                  </div>'''
)

# Modification 5: Add bubble style for user messages
content = content.replace(
    '''<div className="prose prose-slate prose-sm max-w-none leading-relaxed text-slate-800">
                                     {msg.role === 'user' ? (
                                        // User messages: plain text with pre-wrap
                                        <div className="whitespace-pre-wrap">{msg.text}</div>''',
    '''<div className={`prose prose-slate prose-sm max-w-none leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-br from-illini-blue to-illini-orange text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%]' : 'text-slate-800'}`}>
                                     {msg.role === 'user' ? (
                                        <div className="whitespace-pre-wrap text-white">{msg.text}</div>'''
)

# Write the modified content back
with open(r'd:\NewFolder\Ask\Ask\illiniguide---uiuc-knowledge-base\components\ChatScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully applied all 5 message layout modifications!")
print("   1. Container layout - user messages reversed")
print("   2. User avatar - gradient background with initials")
print("   3. Content container - user messages right-aligned")
print("   4. Message label - user labels right-aligned")
print("   5. Message bubble - user messages with gradient bubble style")
