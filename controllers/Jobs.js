require('dotenv').config()
const db = require('../config/connection')
const collection = require('../config/collection')
const { ObjectId } = require('mongodb')
const { validationResult } = require('express-validator')
const moment = require('moment')


module.exports = {
    addJob : async (req,res) => {
        const { hrId } = req.params
        const { cid } = req.query
        const jobDetails = {...req.body , companyId : ObjectId(cid) , hrId : ObjectId(hrId) , status : false , createdDate : new Date() , applications : []}

        var errors = validationResult(req)
        
        try {
            
            //Express Validator error.
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }

            let result  = await db.get().collection(collection.JOBS_COLLECTION).insertOne(jobDetails)

            let job = await db.get().collection(collection.JOBS_COLLECTION).findOne({_id:result.insertedId})

            res.status(200).json({job})
        } catch (error) {
            res.status(500).json({Err : "Something went wrong"})
        }
    },
    addFreeJob: async (req,res) => {
        const {jobId} = req.body
        const {hrId} = req.params 

        try {

        var accessCheck =await db.get().collection(collection.JOBS_COLLECTION).findOne({_id : ObjectId(jobId)})

        if(hrId !== accessCheck.hrId.toString()) return res.status(400).json({msg : "Invalid Access to Delete the Job"})

        // let unix = new moment().valueOf();

        // await db.get().collection(collection.JOBS_COLLECTION).createIndex({createdDate : unix } , { expireAfterSeconds : 86400 *  3 })

        await db.get().collection(collection.JOBS_COLLECTION).updateOne({_id: ObjectId(jobId)}, {
            $set : {
                status : true,
                payPlan : 'Free',
            }
        })
            
        res.status(200).json({msg : "Added free plan to Job"})
            
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    getJobById : async(req,res) => {
        const id = req.params.id

        try {

            var jobDetails =await db.get().collection(collection.JOBS_COLLECTION).findOne({_id : ObjectId(id)})

            res.status(200).json(jobDetails)
        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    deleteJob : async(req, res) => {
        const {id} = req.params
        const {hrId} = req.query
        try {
            var accessCheck =await db.get().collection(collection.JOBS_COLLECTION).findOne({_id : ObjectId(id)})

            if(hrId !== accessCheck.hrId.toString()) return res.status(400).json({msg : "Invalid Access to Delete the Job"})

            var deleteJob =await db.get().collection(collection.JOBS_COLLECTION).deleteOne({_id : ObjectId(id)})

            res.status(200).json({msg : 'Job Deteleted Successfully'})

        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    },
    getAllJobsByHr : async (req ,res) => {
        const {hrId} = req.params
        
        try {

            let AllJobsByHr = await db.get().collection(collection.JOBS_COLLECTION).aggregate([
                {
                    $match : {
                        $and : [
                            { hrId : ObjectId(hrId) },
                            { status : true }
                        ]
                    }
                },
                {
                    $lookup : {
                     from : collection.COMPANY_COLLECTION,
                     localField : "companyId" ,
                     foreignField : "_id",
                     as : 'companyDetails'
                    }
                }
            ]).toArray()

            res.status(200).json(AllJobsByHr)

        } catch (error) {
            console.log(error);
            res.status(500).json({Err : error})
        }
    }
}