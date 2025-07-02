import { aiService } from './ai.service.js'
import express from 'express'
import '../../config.js'

export const aiRoutes = express.Router()
aiRoutes.post('/generateBoard', async (req, res) => {
    try {
        const { description, boardType, numGroups, numTasks, theme, language, colorPalette } = req.body
        // Generate mock board for testing
        const groupTitles = ['To Do', 'In Progress', 'Done']
        const groupColors = ['#037F4C', '#FFCB00', '#E2445C']
        const groups = Array.from({ length: Math.max(0, numGroups || 3) }, (_, gi) => ({
            id: `g${gi + 1}`,
            title: groupTitles[gi] || `Group ${gi + 1}`,
            color: groupColors[gi] || '#CCCCCC',
            tasks: Array.from({ length: Math.max(0, numTasks || 5) }, (_, ti) => ({
                id: `t${gi + 1}-${ti + 1}`,
                title: `Task ${ti + 1}`
            }))
        }))
        const board = {
            title: description || 'Untitled Board',
            type: boardType || 'kanban',
            theme: theme || 'light',
            language: language || 'en',
            colorPalette: colorPalette || 'default',
            groups,
        }
        res.status(200).json({ message: 'Mock board generated successfully', data: board })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal Server Error', error: err.message })
    }
})
