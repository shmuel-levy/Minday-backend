import express from 'express'

import { requireAuth  } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import { getBoards, getBoardById, saveBoards, createBoard, updateBoard, removeBoard, removeGroup, createGroup, updateGroup, createColumn, updateColumn, removeColumn,
    createLog,
    createTask, removeTask, updateTask, addTaskUpdate, removeTaskUpdate, addColumnValue, updateColumnValue, removeColumnValue, moveTask, 
    createLabel,
    updateLabel,
    removeLabel,
    saveDashboardWidgets} from './board.controller.js'

const router = express.Router()
// router.use(log)

////// BOARD //////
router.get('/', getBoards)
router.get('/:boardId', getBoardById)
router.post('/', createBoard)
router.put('/:boardId',  updateBoard)
router.put('/boards/reorder', saveBoards)
router.delete('/:boardId',  removeBoard)
router.put('/:boardId/log', createLog)
router.put('/:boardId/dashboard-widgets', saveDashboardWidgets)

////// GROUP //////
router.post('/:boardId/group', createGroup)
router.put('/:boardId/group/:groupId',  updateGroup)
router.delete('/:boardId/group/:groupId',  removeGroup)

////// COLUMN //////
router.post('/:boardId/column', createColumn)
router.put('/:boardId/column/:columnId', updateColumn)
router.delete('/:boardId/column/:columnId', removeColumn)

////// LABEL //////
router.put('/:boardId/column/:columnId/label/:labelId',updateLabel )
router.post('/:boardId/column/:columnId/label', createLabel)
router.delete('/:boardId/column/:columnId/label/:labelId', removeLabel)

////// TASK //////
router.post('/:boardId/group/:groupId/task', createTask)
router.put('/:boardId/group/:groupId/task/:taskId',  updateTask)
router.delete('/:boardId/group/:groupId/task/:taskId', removeTask)
router.post('/:boardId/group/:groupId/task/:taskId/update', addTaskUpdate)
router.post('/:boardId/group/:groupId/task/:taskId/update/:updateId', removeTaskUpdate)
router.put('/:boardId/group/:groupId/task/:taskId/columnValue/:colId', updateColumnValue)
router.post('/:boardId/group/:groupId/task/:taskId/columnValue/:colId', addColumnValue)
router.delete('/:boardId/group/:groupId/task/:taskId/columnValue/:colId', removeColumnValue)
router.put('/:boardId/task/:taskId', moveTask)

export const boardRoutes = router