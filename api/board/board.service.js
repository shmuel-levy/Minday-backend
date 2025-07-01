import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'
import { log } from '../../middlewares/logger.middleware.js'


const PAGE_SIZE = 3

export const boardService = {
	query,
	getById,
	saveBoards,
	add,
	update,
	remove,
	createGroup,
	updateGroup,
	removeGroup,
	createColumn,
    updateColumn,
    removeColumn,
    createTask,
    updateTask,  
    removeTask,
    addTaskUpdate,
	removeTaskUpdate,
    addColumnValue,
	updateColumnValue,
    removeColumnValue,
	moveTask,
	createLabel,
	updateLabel,
	removeLabel,
	createLog,
}

async function query(account) {
	try {
		const criteria = _buildCriteria(account)

		const collection = await dbService.getCollection('board')

		const boards = await collection.find(criteria)
			.sort({ pos: 1 }) 
			.project({ 
				_id: 1, 
				name: 1, 
				title: '$name', 
				isStarred: 1 
			})
			.toArray()

		return boards

	} catch (err) {
		logger.error('cannot find boards', err)
		throw err
	}
}

async function getById(boardId) {
	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }
		console.log('getById criteria:', criteria);
		
		console.log('criteria:', criteria);
		
		const collection = await dbService.getCollection('board')
		const board = await collection.findOne(criteria)
		console.log('board:', board);
		

		// board.createdAt = board._id.getTimestamp()
		return board
	} catch (err) {
		logger.error(`while finding board ${boardId}`, err)
		throw err
	}
}

async function saveBoards(miniBoards) {
	try {
		const collection = await dbService.getCollection('board')

		const bulkOps = miniBoards.map((miniBoard, idx) => ({
			updateOne: {
				filter: { _id: new ObjectId(miniBoard._id) },
				update: {
					$set: {
						pos: idx,
						name: miniBoard.name,
						isStarred: miniBoard.isStarred
					}
				}
			}
		}))

		await collection.bulkWrite(bulkOps)

		return miniBoards
	} catch (err) {
		logger.error(`Failed to reorder boards`, err)
		throw err
	}
}

async function remove(boardId, loggedinUser) {
	try {
		const criteria = { _id: new ObjectId(boardId) }
		console.log('criteria:', criteria);

		console.log(criteria, 'criteria in remove');
		

		

		const collection = await dbService.getCollection('board')
		const res = await collection.deleteOne(criteria)
		console.log('res:', res);
		

		if (res.deletedCount === 0) throw (`cannot find board`)

		//reindex
		const boards = await collection.find({}, { projection: { _id: 1 } }).sort({ pos: 1 }).toArray()
		const bulkOps = boards.map((board, idx) => ({
			updateOne: {
				filter: { _id: board._id },
				update: { $set: { pos: idx } }
			}
		}))
		if (bulkOps.length) await collection.bulkWrite(bulkOps)

		const miniBoards = await query(loggedinUser.account)

		return miniBoards
	} catch (err) {
		logger.error(`cannot remove board ${boardId}`, err)
		throw err
	}
}

async function add(board, loggedinUser) {
	try {
		const collection = await dbService.getCollection('board')
		const lastBoard = await collection.find().sort({ pos: -1 }).limit(1).toArray()
		const nextPos = lastBoard.length ? lastBoard[0].pos + 1 : 0

		const boardToSave = {
		name: board.name,
		activities: board.activities,
		columns: board.columns,
		groups: board.groups,
		isStarred: false,
		pos: nextPos,
		account: board.account || loggedinUser.account || '',
		createdBy: loggedinUser._id,
		members: [{ _id: loggedinUser._id, permission: 'editor'}]
	}
		const insertRes = await collection.insertOne(boardToSave)
		const newBoard = { ...boardToSave, _id: insertRes.insertedId }

		const miniBoards = await query(loggedinUser.account)

		return {miniBoards, newBoard}

	} catch (err) {
		logger.error('cannot insert board', err)
		throw err
	}
}

async function update(board) {

	try {
		// const criteria = { _id: ObjectId.createFromHexString(board._id) }
		const criteria = { _id: new ObjectId(board._id) }

		const collection = await dbService.getCollection('board')
		const { _id, ...boardWithoutId } = board
		await collection.updateOne(criteria, { $set: boardWithoutId })
		
		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot update board ${board._id}`, err)
		throw err
	}
}

async function createGroup(group, boardId, isTop, idx, loggedinUser) {
	const groupToSave = {
		id: group.id,
		name: group.name,
		isCollapse: group.isCollapse,
		color: group.color,
		tasks: group.tasks,
		isStarred: false,
		createdBy: loggedinUser._id,
		createdAt: Date.now()
	}
	try {
		// const criteria = { _id:boardId }
const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		if (isTop) {
		await collection.updateOne(criteria, {
			$push: { groups: { $each: [groupToSave], $position: 0 } }
		})
		} else if (idx !== null && typeof idx === 'number') {
		await collection.updateOne(criteria, {
			$push: { groups: { $each: [groupToSave], $position: idx + 1 } }
		})
		} else {
		await collection.updateOne(criteria, {
			$push: { groups: groupToSave }
		})
		}

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot add grpup ${group.id}`, err)
		throw err
	}
}

async function updateGroup(group, boardId, groupId) {	
	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne(criteria, { $set: { "groups.$[group]": group } }, { arrayFilters: [{ "group.id": groupId }] })

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot update group ${group.id}`, err)
		throw err
	}
}

async function removeGroup(groupId, boardId) {
	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne(criteria, { $pull: { groups: { id: groupId } } })

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot remove group ${groupId}`, err)
		throw err
	}
}

async function createColumn(column, boardId, loggedinUser) {
	
	const columnToSave = {
		id: column.id,
		name: column.name,
		width: column.width,
		type: column.type,
		createdBy: loggedinUser._id,
		createdAt: column.createdAt
	}

	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }
console.log('criteria:', criteria)
		const collection = await dbService.getCollection('board')
		await collection.updateOne(criteria, { $push: { columns: columnToSave } })

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot add column ${column.id}`, err)
		throw err
	}
}

async function updateColumn(column, boardId) {
	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne(criteria, { $set: { "columns.$[column]": column } }, { arrayFilters: [{ "column.id": column.id }] })

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot update column ${column.id}`, err)
		throw err
	}
}

async function removeColumn(columnId, boardId) {
	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		collection.updateOne(criteria, { $pull: { columns: { id: columnId } } })

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot remove column ${columnId}`, err)
		throw err
	}
}

async function createLabel(label, columnId, boardId,loggedinUser) {
	const labelToSave = {
		id: label.id,
		name: label?.name,
		color: label.color
	}
	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne(
			criteria,
			{ $push: { "columns.$[column].type.labels": labelToSave } },
			{ arrayFilters: [{ "column.id": columnId }] }
		)
		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot add label ${label.id}`, err)
		throw err
	}
}


async function updateLabel(labelToUpdate, boardId) {
	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne(criteria,
			 { $set: { "columns.$[column].type.labels.$[lbl]": labelToUpdate } },
			 {
				arrayFilters: [
				  { "column.type.labels": { $exists: true } },
				  { "lbl.id": labelToUpdate.id }
				]
			  }
			)

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot update label ${labelToUpdate.id}`, err)
		throw err
	}
}

async function removeLabel(labelId, columnId, boardId) {
	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne(criteria,
			 { $pull: { "columns.$[column].type.labels": {id: labelId} }},
			{ arrayFilters: [{ "column.id": columnId }] })

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot remove task ${labelId}`, err)
		throw err
	}
}

// =====================================================================

async function createTask(task, boardId, groupId, isTop, loggedinUser) {
	const taskToSave = {
		id: task.id,
		columnValues: task.columnValues,
		createdBy: loggedinUser._id,
		createdAt: Date.now(),
		updates: task.updates
	}
	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		isTop 
		? await collection.updateOne( criteria, { $push: { "groups.$[group].tasks": {$each: [taskToSave], $position: 0 }}}, {arrayFilters: [{ "group.id": groupId }]}) 
		: await collection.updateOne( criteria, { $push: { "groups.$[group].tasks": taskToSave }},{ arrayFilters: [{ "group.id": groupId }]})

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot add task ${task.id}`, err)
		throw err
	}
}

async function removeTask(taskId, groupId, boardId) {
	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne(criteria, { $pull: { "groups.$[group].tasks": {id: taskId} }},{ arrayFilters: [{ "group.id": groupId }] })

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot remove task ${taskId}`, err)
		throw err
	}
}

async function updateTask(task, boardId, groupId, taskId) {
    try {
        const criteria = { _id: new ObjectId(boardId) }
        const collection = await dbService.getCollection('board')
        
        // First, let's find the board and validate the task exists
        const board = await collection.findOne(criteria)
        if (!board) throw new Error('Board not found')
        
        const group = board.groups.find(g => g.id === groupId)
        if (!group) throw new Error('Group not found')
        
        const existingTaskIndex = group.tasks.findIndex(t => t.id === taskId)
        if (existingTaskIndex === -1) throw new Error('Task not found')
        
        // Merge the updated task with existing task data
        const updatedTask = {
            ...group.tasks[existingTaskIndex],
            ...task,
            id: taskId, // Ensure ID doesn't change
            updatedAt: Date.now()
        }
        
        // Update the task in the database
        await collection.updateOne(
            criteria,
            { 
                $set: { 
                    "groups.$[group].tasks.$[task]": updatedTask 
                } 
            },
            { 
                arrayFilters: [
                    { "group.id": groupId }, 
                    { "task.id": taskId }
                ] 
            }
        )

        const updatedBoard = await collection.findOne(criteria)
        return updatedBoard
    } catch (err) {
        logger.error(`cannot update task ${taskId}`, err)
        throw err
    }
}

async function addTaskUpdate(update, boardId, groupId, taskId) {
	const updateToSave = {
		id: update.id,
		createdBy: update.createdBy,
		createdAt: Date.now(),
		txt: update.txt
	}

	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne( criteria, { $push: { "groups.$[group].tasks.$[task].updates": {$each: [updateToSave], $position: 0 }}}, {arrayFilters: [{ "group.id": groupId}, {"task.id": taskId }]}) 

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot send update ${update.id}`, err)
		throw err
	}
}

async function removeTaskUpdate(updateId, boardId, groupId, taskId, loggedinUser) {

	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		const board = await collection.findOne(criteria)
		if (!board) throw new Error('Board not found')

		const group = board.groups.find(g => g.id === groupId)
		if (!group) throw new Error('Group not found')

		const task = group.tasks.find(t => t.id === taskId)
		if (!task) throw new Error('Task not found')

		const update = task.updates.find(u => u.id === updateId)
		if (!update) throw new Error('Update not found')

		let updateOwnerId = update.createdBy;
		if (!updateOwnerId && update.byMember && update.byMember._id) {
			updateOwnerId = update.byMember._id;
		}
		console.log('[DEBUG] loggedinUser._id:', loggedinUser._id);
		console.log('[DEBUG] updateOwnerId:', updateOwnerId);

		if (!updateOwnerId) {
			// Allow deletion if owner is missing (legacy update)
			console.log('[DEBUG] Update has no owner field, allowing deletion.');
		} else if (updateOwnerId.toString() !== loggedinUser._id.toString()) {
			throw new Error('Unauthorized: Cannot delete someone else\'s update')
		}

		
		await collection.updateOne( criteria, { $pull: { "groups.$[group].tasks.$[task].updates": {id: updateId}}}, {arrayFilters: [{ "group.id": groupId}, {"task.id": taskId }]}) 

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot send update ${update.id}`, err)
		throw err
	}
}

async function addColumnValue(value, boardId, groupId, taskId, colId) {
	const columnValueToSave = {
		colId: colId,
		value: value
	}

	// console.log('columnValueToSave in add', columnValueToSave)

	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne( criteria, { $push: { "groups.$[group].tasks.$[task].columnValues": columnValueToSave }}, 
			{arrayFilters: [{ "group.id": groupId}, {"task.id": taskId } ]}) 

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot add column value ${value} in column ${colId}`, err)
		throw err
	}
}

async function updateColumnValue(value, boardId, groupId, taskId, colId) {
	const columnValueToSave = {
		colId: colId,
		value: value
	}
		// console.log('columnValueToSave in update', columnValueToSave)

	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne( criteria, { $set: { "groups.$[group].tasks.$[task].columnValues.$[columnValue]": columnValueToSave }}, 
			{arrayFilters: [{ "group.id": groupId}, {"task.id": taskId }, {"columnValue.colId": colId }]}) 

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot add column value ${value} in column ${colId}`, err)
		throw err
	}
}

async function removeColumnValue(boardId, groupId, taskId, colId) {

	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne( criteria, { $pull: { "groups.$[group].tasks.$[task].columnValues": { colId } }}, 
			{arrayFilters: [{ "group.id": groupId}, {"task.id": taskId } ]}) 

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot remove column value in column ${colId}`, err)
		throw err
	}
}

async function moveTask(taskId, boardId, fromGroupId, toGroupId, toIndex) {
	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')

		const board = await collection.findOne(criteria)
		if (!board) throw new Error('Board not found')

		const fromGroup = board.groups.find(group => group.id === fromGroupId)
		if (!fromGroup) throw new Error('From group not found')

		const task = fromGroup.tasks.find(task => task.id === taskId)
		if (!task) throw new Error('Task not found')
		
		await collection.updateOne(criteria, {$pull: {"groups.$[fromGroup].tasks": { id: taskId } }},
			{ arrayFilters: [{ "fromGroup.id": fromGroupId }] })

		await collection.updateOne(criteria, { $push: {"groups.$[toGroup].tasks": {$each: [task], $position: toIndex}}},
			{arrayFilters: [{ "toGroup.id": toGroupId }]})

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot move task ${taskId}`, err)
		throw err
	}
}

async function createLog(logObject, boardId) {

	console.log(boardId)

	try {
		// const criteria = { _id: ObjectId.createFromHexString(boardId) }
		const criteria = { _id: new ObjectId(boardId) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne(criteria, { $push: { activities: { $each: [logObject], $position: 0 }} })

		const updatedBoard = await collection.findOne(criteria)
		return updatedBoard
	} catch (err) {
		logger.error(`cannot log activity ${logObject.id}`, err)
		throw err
	}
}

function _buildCriteria(filterBy) {
	// If no filterBy or empty account, return empty criteria to show all boards
	if (!filterBy || !filterBy.trim()) {
		return {}
	}
	
	const criteria = {
		account: { $regex: filterBy, $options: 'i' },
	}

	return criteria
}

function _buildSort(filterBy) {
	if (!filterBy.sortField) return {}
	return { [filterBy.sortField]: filterBy.sortDir }
}