import { logger } from '../../services/logger.service.js'
import { socketService } from '../../services/socket.service.js'
import { boardService } from './board.service.js'

export async function getBoards(req, res) {
    const loggedinUser = req.loggedinUser || { 
        _id: "682d9bdb00f2a05b9a68d06b", 
        account: "acc002" 
    }
    
    const account = loggedinUser?.account || ''
    console.log('Looking for account:', account) // Debug line
    
    try {
        const boards = await boardService.query(account)
        console.log('Found boards count:', boards.length) // Debug line
        console.log('First board name:', boards[0]?.name) // Debug line
        res.json(boards)
    } catch (err) {
        logger.error('Failed to get boards', err)
        res.status(400).send({ err: 'Failed to get boards' })
    }
}

export async function getBoardById(req, res) {
	try {
		const { boardId } = req.params
		const board = await boardService.getById(boardId)
		res.json(board)
	} catch (err) {
		logger.error('Failed to get board', err)
		res.status(400).send({ err: 'Failed to get board' })
	}
}

export async function saveBoards(req, res) {
	const { loggedinUser } = req
	const { reorderedBoards } = req.body
	try {
		const miniBoards = await boardService.saveBoards(reorderedBoards)

		if(miniBoards) {
			socketService.broadcast({ type:'mini-boards-update', data: miniBoards, userId: loggedinUser._id})
		}

		res.json(miniBoards)
	} catch (err) {
		logger.error('Failed to update boards', err)
		res.status(400).send({ err: 'Failed to update boards' })
	}
}

export async function createBoard(req, res) {
    // Mock user for testing when auth is disabled
    const loggedinUser = req.loggedinUser || { 
        _id: "682d9bdb00f2a05b9a68d06b", 
        account: "acc002" 
    }
    
    const board = req.body
    try {
        const {miniBoards, newBoard} = await boardService.add(board, loggedinUser)
        res.json(newBoard)
    } catch (err) {
        logger.error('Failed to add board', err)
        res.status(400).send({ err: 'Failed to add board' })
    }
}

export async function removeBoard(req, res) {
	try {
		// Mock user for testing - same as other functions
		const loggedinUser = req.loggedinUser || { 
			_id: "682d9bdb00f2a05b9a68d06b", 
			account: "acc002" 
		}
		const { boardId } = req.params
		console.log('Removing board with ID:', boardId) // Debug line;
		
		const miniBoards = await boardService.remove(boardId, loggedinUser)
		console.log(
			'Mini boards after removal:', miniBoards ? miniBoards.length : 'No mini boards found'
		);
		

		if(miniBoards) {
			socketService.broadcast({ type:'mini-boards-update', data: miniBoards, userId: loggedinUser._id})
		}

		res.status(200).json(miniBoards)
	} catch (err) {
		logger.error('Failed to remove board', err)
		res.status(400).send({ err: 'Failed to remove board' })
	}
}

export async function updateBoard(req, res) {
    const loggedinUser = req.loggedinUser || { 
        _id: "682d9bdb00f2a05b9a68d06b", 
        account: "acc002" 
    }
    const board = req.body
    try {
        const updatedBoard = await boardService.update(board, loggedinUser)
        res.status(200).json(updatedBoard)
    } catch (err) {
        logger.error('Failed to update board', err)
        res.status(400).send({ err: 'Failed to update board' })
    }
}

export async function createGroup(req, res) {
    // Mock user for testing
    const loggedinUser = req.loggedinUser || { 
        _id: "682d9bdb00f2a05b9a68d06b", 
        account: "acc002" 
    }
    
    const { boardId } = req.params
    const isTop = req.body.isTop
    const idx = req.body.idx
    const group = req.body.group
    
    try {
        const updatedBoard = await boardService.createGroup(group, boardId, isTop, idx, loggedinUser)
        res.status(200).json(updatedBoard)
    } catch (err) {
        logger.error('Failed to add group', err)
        res.status(400).send({ err: 'Failed to add group' })
    }
}

export async function updateGroup(req, res) {
	const { loggedinUser, body: { group } } = req
	const { boardId ,groupId } = req.params
    // const { userId: _id, isAdmin } = loggedinUser

	try {
		const updatedBoard = await boardService.updateGroup(group, boardId, groupId, loggedinUser)

		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to update group', err)
		res.status(400).send({ err: 'Failed to update group' })
	}
}

export async function removeGroup(req, res) {
	try {
		const { loggedinUser } = req
		const { boardId, groupId } = req.params
		const updatedBoard = await boardService.removeGroup(groupId, boardId)

		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to remove group', err)
		res.status(400).send({ err: 'Failed to remove group' })
	}
}

export async function createColumn(req, res) {
	const { loggedinUser, body } = req
	const { boardId } = req.params
	const column = body.column
	
	try {
		const updatedBoard = await boardService.createColumn(column, boardId, loggedinUser)

		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to add column', err)
		res.status(400).send({ err: 'Failed to add column' })
	}
}

export async function updateColumn(req, res) {
	const { loggedinUser, body: { column } } = req
	const { boardId } = req.params
    // const { userId: _id, isAdmin } = loggedinUser

	try {
		const updatedBoard = await boardService.updateColumn(column, boardId)

		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to update column', err)
		res.status(400).send({ err: 'Failed to update column' })
	}
}

export async function removeColumn(req, res) {
	try {
		const { loggedinUser } = req
		const { boardId, columnId } = req.params
		const updatedBoard = await boardService.removeColumn(columnId, boardId)

		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to remove column', err)
		res.status(400).send({ err: 'Failed to remove column' })
	}
}


export async function createLabel(req, res) {
	const { loggedinUser, body } = req
	const { boardId, columnId } = req.params
	const label = body.label
	console.log('body received:', body.label)
	try {
		const updatedBoard = await boardService.createLabel(label, columnId, boardId,loggedinUser)

		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to add label', err)
		res.status(400).send({ err: 'Failed to add label' })
	}
}


export async function updateLabel(req, res) {
	const { loggedinUser, body: { labelToUpdate } } = req
	const { boardId } = req.params
    // const { userId: _id, isAdmin } = loggedinUser

	try {
		const updatedBoard = await boardService.updateLabel(labelToUpdate, boardId)

		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to update column', err)
		res.status(400).send({ err: 'Failed to update column' })
	}
}

export async function removeLabel(req, res) {
	try {
		const { loggedinUser } = req
		const { boardId, columnId, labelId } = req.params
		const updatedBoard = await boardService.removeLabel(labelId, columnId, boardId)

		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}
		
		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to remove task', err)
		res.status(400).send({ err: 'Failed to remove task' })
	}
}


export async function createTask(req, res) {
    // Mock user for testing
    const loggedinUser = req.loggedinUser || { 
        _id: "682d9bdb00f2a05b9a68d06b", 
        account: "acc002" 
    }
    
    const { boardId, groupId } = req.params
    const isTop = req.body.isTop
    const task = req.body.task

    try {
        const updatedBoard = await boardService.createTask(task, boardId, groupId, isTop, loggedinUser)
        res.status(200).json(updatedBoard)
    } catch (err) {
        logger.error('Failed to add task', err)
        res.status(400).send({ err: 'Failed to add task' })
    }
}

export async function removeTask(req, res) {
	try {
		const { loggedinUser } = req
		const { boardId, groupId, taskId } = req.params
		const updatedBoard = await boardService.removeTask(taskId, groupId, boardId, loggedinUser)

		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}
		
		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to remove task', err)
		res.status(400).send({ err: 'Failed to remove task' })
	}
}

export async function updateTask(req, res) {
    const loggedinUser = req.loggedinUser || { 
        _id: "682d9bdb00f2a05b9a68d06b", 
        account: "acc002" 
    }
    const { boardId, groupId, taskId } = req.params
    const { task } = req.body
    try {
        const updatedBoard = await boardService.updateTask(task, boardId, groupId, taskId, loggedinUser)
        if(updatedBoard) {
            socketService.broadcast({ 
                type:'board-update', 
                data: updatedBoard, 
                userId: loggedinUser._id
            })
        }
        res.status(200).json(updatedBoard)
    } catch (err) {
        logger.error('Failed to update task', err)
        res.status(400).send({ err: 'Failed to update task' })
    }
}

export async function addTaskUpdate(req, res) {
	const { loggedinUser, body } = req
	const { boardId, groupId, taskId } = req.params
	const update = body.update

	try {
		const updatedBoard = await boardService.addTaskUpdate(update, boardId, groupId, taskId)

		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to send update', err)
		res.status(400).send({ err: 'Failed to send update' })
	}
}

export async function removeTaskUpdate(req, res) {
	const { loggedinUser, body } = req
	const { boardId, groupId, taskId, updateId } = req.params

	try {
		const updatedBoard = await boardService.removeTaskUpdate(updateId, boardId, groupId, taskId, loggedinUser)

		// if(updatedBoard) {
		// 	socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser?._id})
		// }

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to send update', err)
		res.status(400).send({ err: 'Failed to send update' })
	}
}

export async function addColumnValue(req, res) {
	const { loggedinUser, body } = req
	const { boardId, groupId, taskId, colId } = req.params
	const value = body.value

	try {
		const updatedBoard = await boardService.addColumnValue(value, boardId, groupId, taskId, colId)

		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to add column value', err)
		res.status(400).send({ err: 'Failed to add column value' })
	}
}

export async function updateColumnValue(req, res) {
	const { loggedinUser, body } = req
	const { boardId, groupId,taskId, colId } = req.params
	const value = body.value

	try {
		const updatedBoard = await boardService.updateColumnValue(value, boardId, groupId, taskId, colId)

		console.log(updatedBoard)
		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to update column value', err)
		res.status(400).send({ err: 'Failed to update column value' })
	}
}

export async function removeColumnValue(req, res) {

	const { loggedinUser, body } = req
	const { boardId, groupId, taskId, colId } = req.params

	try {
		const updatedBoard = await boardService.removeColumnValue(boardId, groupId, taskId, colId)

		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to remove column value', err)
		res.status(400).send({ err: 'Failed to remove column value' })
	}
}

export async function moveTask(req, res) {
	try {
		const { loggedinUser, body } = req
		const fromGroupId = body.fromGroupId
		const toGroupId = body.toGroupId
		const toIndex = body.toIndex
		const { boardId, taskId } = req.params
		const updatedBoard = await boardService.moveTask(taskId, boardId, fromGroupId, toGroupId, toIndex)
		
		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to move task', err)
		res.status(400).send({ err: 'Failed to move task' })
	}
}

export async function createLog(req, res) {
	try {
		const { loggedinUser, body } = req
		const {logObject} = body
		const { boardId } = req.params
		const updatedBoard = await boardService.createLog(logObject, boardId)
		
		// if(updatedBoard) {
		// 	socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		// }

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to log activity', err)
		res.status(400).send({ err: 'Failed to log activity' })
	}
}

export async function saveDashboardWidgets(req, res) {
	try {
		// Mock user for testing - same as other functions
		const loggedinUser = req.loggedinUser || { 
			_id: "682d9bdb00f2a05b9a68d06b", 
			account: "acc002" 
		}
		const { boardId } = req.params
		const { dashboardWidgets } = req.body
		
		console.log('Saving dashboard widgets for board:', boardId)
		console.log('Dashboard widgets:', dashboardWidgets)
		
		const updatedBoard = await boardService.saveDashboardWidgets(boardId, dashboardWidgets)
		
		if(updatedBoard) {
			socketService.broadcast({ type:'board-update', data: updatedBoard, userId: loggedinUser._id})
		}

		res.status(200).json(updatedBoard)
	} catch (err) {
		logger.error('Failed to save dashboard widgets', err)
		res.status(400).send({ err: 'Failed to save dashboard widgets' })
	}
}