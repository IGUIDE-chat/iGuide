import { Project } from 'ts-morph'

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
})

console.log('Starting lightweight Colocation migration...')

project.createDirectory('src/components/housing/hooks')
project.createDirectory('src/components/housing/types')
project.createDirectory('src/components/housing/store')
project.createDirectory('src/components/housing/constants')
project.createDirectory('src/components/ui')

const fileMoves = [
  // Store
  {
    src: '/src/contexts/DormDataContext.tsx',
    dest: '/src/components/housing/store/DormDataContext.tsx',
  },
  {
    src: '/src/contexts/DormUserInteractionContext.tsx',
    dest: '/src/components/housing/store/DormUserInteractionContext.tsx',
  },
  {
    src: '/src/contexts/HousingContext.tsx',
    dest: '/src/components/housing/store/HousingContext.tsx',
  },

  // Hooks
  {
    src: '/src/hooks/useDormCommentStats.ts',
    dest: '/src/components/housing/hooks/useDormCommentStats.ts',
  },
  {
    src: '/src/hooks/useDormComments.ts',
    dest: '/src/components/housing/hooks/useDormComments.ts',
  },
  {
    src: '/src/hooks/useDormFilterBadge.ts',
    dest: '/src/components/housing/hooks/useDormFilterBadge.ts',
  },
  {
    src: '/src/hooks/useDormUserInteraction.ts',
    dest: '/src/components/housing/hooks/useDormUserInteraction.ts',
  },

  // Types
  {
    src: '/src/types/housing.ts',
    dest: '/src/components/housing/types/index.ts',
  },
]

for (const sourceFile of project.getSourceFiles()) {
  const p = sourceFile.getFilePath()

  // Handle explicit moves
  const explicitMove = fileMoves.find((m) => p.endsWith(m.src))
  if (explicitMove) {
    console.log(`Moving explicit: ${p} -> ${explicitMove.dest}`)
    sourceFile.move(p.replace(explicitMove.src, explicitMove.dest))
    continue
  }

  // Handle generic housing constants
  if (
    p.includes('/src/constants/housing/') &&
    !p.includes('/src/components/housing/')
  ) {
    console.log(`Moving constant: ${p}`)
    sourceFile.move(
      p.replace('/src/constants/housing/', '/src/components/housing/constants/')
    )
  }
}

console.log('Saving AST... this will update all imports globally.')
project.saveSync()
console.log('Migration complete!')
