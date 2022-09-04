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

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("message", "private_message").required()
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
    } catch {
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
            time: dayjs().format("hh:mm:ss")
        });
        res.status(201).send("Ok");
    } catch {
        res.sendStatus(422);
    };

});

server.get("/participants", async (req, res) =>{
    try{
        const response = await db.collection("participantes").find().toArray();
        res.status(200).send(response);
    } catch {
        res.sendStatus(422);
    };
});

server.post("/messages", async (req, res) => {
    const message = req.body;
    const from = req.headers.user;

    const validation = messageSchema.validate(message);
    if (validation.error){
        res.status(422).send("error");
        return;
    };

    try{
        const participants = await db.collection("participantes").find().toArray();
        let verif = false;
        for (let i = 0; i < participants.length; i++){
            if (from === participants[i].name){
                verif = true;
                break;
            };
        };
        if (!verif){ 
            res.status(422).send("erro");
            return;
        };
    } catch {
        res.sendStatus(422);
    };

    try{
        const env = await db.collection("mensagens").insertOne({
            ...message,
            from,
            time: dayjs().format("hh:mm:ss")
        });
        res.status(201).send("Ok");
    } catch {
        res.sendStatus(422);
    };
});

server.get("/messages", async (req, res) => {
    const limit = req.query.limit;
    const user = req.headers.user;
    let messages = [];
    try{
        const totalmessages = await db.collection("mensagens").find().toArray();

        messages = (totalmessages.filter((element)=> {
            return element.type === "message" || 
            element.type === "status" ||
            (element.type === "private_message" && element.from === user);
        }))
        if (limit && messages.length > limit){
            messages = messages.slice(-limit);
        };
        res.status(200).send(messages);
    } catch {
        res.sendStatus(422);
    };
});

server.post("/status", async (req, res) => {
    const user = req.headers.user;
    try{
        const participants = await db.collection("participantes").find().toArray();
        const verif = await participants.find(element => {
            return element.name === user;
        });
        if (verif === undefined){
            res.status(404).send("Usuário não encontrado");
            return;
        };
        const update = await db.collection("participantes").updateOne({ _id: verif._id }, { $set: {lastStatus: Date.now()} })
        res.status(200).send("Ok");
    } catch {
        res.sendStatus(422);
    };
});

server.listen(5000); 

