// import { aiService } from './ai.service.js'
// import express from 'express'
// import '../../config.js'

// export const aiRoutes = express.Router()
// aiRoutes.post('/generateBoard', async (req, res) => {
//     try {
//         const { description, boardType, numGroups, numTasks, theme, language, colorPalette } = req.body
//         // Generate mock board for testing
//         const board = {
//             id: 'mock123',
//             title: description || 'AI Generated Board',
//             type: boardType || 'kanban',
//             theme: theme || 'light',
//             language: language || 'en',
//             colorPalette: colorPalette || 'default',
//             groups: Array.from({ length: numGroups || 1 }, (_, gi) => ({
//                 id: `g${gi + 1}`,
//                 title: ['To Do', 'In Progress', 'Done'][gi] || `Group ${gi + 1}`,
//                 color: ['#037F4C', '#FFCB00', '#E2445C'][gi] || '#CCCCCC',
//                 tasks: Array.from({ length: numTasks || 0 }, (_, ti) => ({
//                     id: `t${gi + 1}-${ti + 1}`,
//                     title: `Task ${ti + 1}`
//                 }))
//             }))
//         }
//         // Always ensure groups is an array
//         if (!Array.isArray(board.groups)) board.groups = []
//         res.status(200).json({ message: 'Mock board generated successfully', board })
//     } catch (err) {
//         console.log(err)
//         res.status(500).json({ message: 'Internal Server Error', error: err.message })
//     }
// })
