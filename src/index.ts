import type { Server } from "http";
import express from "express";
import cors from "cors";
import { getGameStatus, getPatchedGameFile, getPatchedPublicGameFile } from "./util";
import { DOWNLOAD_LINK, VERSION } from "./constants";

(async () => {
	const app = express();

	const gs = await getGameStatus();

	if (!gs) throw new Error("The game status request failed.");

	app.use(cors());

	app.get(/\/(api\/)?game.min.js/, async (req, res) => {
		if (req.query.version && typeof req.query.version !== "string")
			return res.status(400).send("Invalid version specified.");
		const version = req.query.version ?? gs.gameClientVersion;
		try {
			res.type("js").send(await getPatchedGameFile(version));
		} catch (e: unknown) {
			if (!(e instanceof Error)) throw e;
			return res.status(400).send(e.message);
		}
	});
	app.get(/\/(api\/)?public-game.min.js/, async(req, res) => {
		if (typeof req.query.hash !== "string")
			return res.status(400).send("No hash specified.");
		try {
			res.type("js").send(await getPatchedPublicGameFile(req.query.hash));
		} catch (e: unknown) {
			if (!(e instanceof Error)) throw e;
			return res.status(400).send(e.message);
		}
	});
	app.get("/version", (req, res) => res.send(VERSION));
	app.get("/download", (req, res) => res.redirect(DOWNLOAD_LINK));
	app.get("/", (req, res) => res.redirect("/game.min.js"));

	const addr: ReturnType<Server["address"]> = app.listen(process.env.PORT ?? 1337, () => 
		console.log(`P-NP has started on :${typeof addr === "string" ? addr : addr?.port ?? ""}!`)).address();
})();
