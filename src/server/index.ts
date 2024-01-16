import express, { Request, Response } from "express";
import request from "request";
import { Profile } from "../models/route-models";
import { AccessTokenResponse } from "../models/os-maps-models";

export const app = express();
const port = process.env["PORT"] || 3002;
const viteMode = process.env["VITE"];
const key = process.env["OS_MAPS_API_KEY"];
const secret = process.env["OS_MAPS_API_SECRET"];

if (!key || !secret) {
    throw Error("Please provide an API key and secret on the command line.\nUsage: server.js <API key> <API Secret>");
}
console.log("Using API key: " + key);

app.get("/api/test", (_, res) => res.json({greeting: "this is a test!"}));
app.get("/api/directions", (req: Request, res: Response) => {
    const apiKey = `5b3ce3597851110001cf6248ce753974beff43f290cdfe4c1a50d56a`;
    const start = req.query.start;
    const end = req.query.end;
    const profile = req.query.profile as Profile;
    request({
        method: "GET",
        url: `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${start}&end=${end}`,
        headers: {
            "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8"
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
});

app.get('/api/token', function (req, res) {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');

    const authString = Buffer.from(`${key}:${secret}`).toString('base64');

    const options = {
        url: 'https://api.os.uk/oauth2/token/v1',
        method: 'POST',
        body: params.toString(),
        headers: {
            Authorization: 'Basic ' + authString,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            const parsedResponse = JSON.parse(body);
            res.set('Content-Type', 'application/json');
            res.send(parsedResponse);
            console.log("Response:", parsedResponse);
        } else {
            res.status(500).send({error: "Failed to get access token, check the API key and secret"});
        }
    });
});

app.get('/api/token-raw', function (req, res) {
    const parsedResponse: AccessTokenResponse = {expires_in: "", issued_at: "", token_type: "", access_token: key};
    res.set('Content-Type', 'application/json');
    res.send(parsedResponse);
    console.log("Response:", parsedResponse);
});

app.get("/api/token-fetch", function (req, res) {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    const authString = Buffer.from(key + ":" + secret).toString("base64");
    fetch("https://api.os.uk/oauth2/token/v1", {
        method: "POST",
        body: params,
        headers: {
            Authorization: "Basic " + authString
        }
    })
        .then(res => res.json())
        .then(json => {
            res.set("Content-Type", "application/json");
            res.send(json);
        })
        .catch(() => {
            res.status(500).send({error: "Failed to get access token, check the API key and secret"});
        });
});


if (viteMode) {
    console.log("running in viteMode:", viteMode);
} else {
    console.log("running in viteMode:", viteMode);
    const frontendFiles = process.cwd() + "/dist";
    app.use(express.static(frontendFiles));
    app.get("/*", (_, res) => {
        res.send(frontendFiles + "/index.html");
    });

    app.listen(port, () => console.log("Server started on port ", port));
}
