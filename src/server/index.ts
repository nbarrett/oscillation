import express, { Request, Response } from "express";
import request from "request";
import { Profile } from "../models/route-models";

export const app = express();
app.get("/api/test", (_, res) => res.json({greeting: "this is a test!"}));
app.get("/api/directions", (req: Request, res: Response) => {
    const apiKey = `5b3ce3597851110001cf6248ce753974beff43f290cdfe4c1a50d56a`;
    const start = req.query.start;
    const end = req.query.end;
    const profile = req.query.profile as Profile
    request({
        method: 'GET',
        url: `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${start}&end=${end}`,
        headers: {
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
        }
    }, (error: any, response: { statusCode: any; headers: any; }, body: any) => {
        try {
            console.log("Status:", response.statusCode);
            console.log("Headers:", JSON.stringify(response.headers));
            console.log("Body Response:", body);
            const parsedResponse = JSON.parse(body);
            console.log("Response:", parsedResponse);
            res.json(parsedResponse);
        } catch (e: any) {
            console.log("Error:", e);
            res.status(500).json(e.toString());
        }
    });

    if (!process.env["VITE"]) {
        const frontendFiles = process.cwd() + "/dist";
        app.use(express.static(frontendFiles));
        app.get("/*", (_, res) => {
            res.send(frontendFiles + "/index.html");
        });
        app.listen(process.env["PORT"]);
    }
});
