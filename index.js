import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from 'joi'

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
    db.collection("participantes").find().toArray().then((data) => {
        for (let i = 0; i < data.length; i++){
            if (name.name === data[i].name){
                console.log(data[i].name)
                res.status(409).send("erro");
            };
        };
    });
    const response = await db.collection("participantes").insertOne({
        ...name,
        lastStatus: Date.now()
    });

    res.status(201).send("Ok");

});

server.get("/participants", async (req, res) =>{
    const response = await db.collection("participantes").find().toArray();
    res.status(200).send(response);
});



server.listen(5000); 

