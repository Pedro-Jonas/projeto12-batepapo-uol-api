import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from 'joi'
import dayjs from "dayjs";

dayjs().format();
dotenv.config();

const server = express();
server.use(cors());
server.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
    db = mongoClient.db("Batepapouol")
});

const nameSchema = joi.object({
    name: joi.string().required()
});

server.post("/participants", async (req, res) =>{
    const name = (req.body);
    const validation = nameSchema.validate(name);
    if (validation.error){
        res.status(422).send("error");
        return;
    };
    try{
        const participants = await db.collection("participantes").find().toArray();

        for (let i = 0; i < participants.length; i++){
            if (name.name === participants[i].name){
                return res.status(409).send("erro");
            };
        };
    } catch(error){
        res.sendStatus(422);
    };
    
    
    try{
        const participant = await db.collection("participantes").insertOne({
            ...name,
            lastStatus: Date.now()
        });
        const message = await db.collection("mensagens").insertOne({
            from : name.name,
            to: "todos",
            text: "entra na sala",
            type: "status",
            time: dayjs().format("HH:mm:ss")
        });
        res.status(201).send("Ok");
    } catch {
        res.sendStatus(422);
    };

});

server.get("/participants", async (req, res) =>{
    const response = await db.collection("participantes").find().toArray();
    res.status(200).send(response);
});



server.listen(5000); 

