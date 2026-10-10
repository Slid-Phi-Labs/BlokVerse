import { r as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime, t as Slot } from "../_libs/radix-ui__react-slot+react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { a as Send, c as Move, d as LockOpen, f as Link2, g as Blocks, h as Coins, i as Sparkles, l as MessageSquare, m as Flag, n as Trophy, o as RotateCcw, p as Layers, r as Timer, s as Play, t as Wallet, u as Lock } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-adXJLjHf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatNumber(n, digits = 0) {
	return n.toLocaleString(void 0, {
		maximumFractionDigits: digits,
		minimumFractionDigits: digits
	});
}
function formatTime(seconds) {
	const s = Math.max(0, Math.floor(seconds));
	return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
var badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tabular", {
	variants: { variant: {
		default: "border-transparent bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
		muted: "border-[var(--color-border)] bg-[var(--color-elevated)] text-[var(--color-muted)]",
		success: "border-transparent bg-[var(--color-success)]/15 text-[var(--color-success)]",
		warn: "border-transparent bg-[var(--color-warn)]/15 text-[var(--color-warn)]",
		danger: "border-transparent bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium transition-[opacity,transform,background-color,color,border-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/50 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:opacity-90",
			secondary: "bg-[var(--color-elevated)] text-[var(--color-fg)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
			ghost: "bg-transparent text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-elevated)]",
			danger: "bg-[var(--color-danger)]/15 text-[var(--color-danger)] border border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/25",
			outline: "border border-[var(--color-border-strong)] bg-transparent text-[var(--color-fg)] hover:bg-[var(--color-elevated)]"
		},
		size: {
			default: "h-11 px-4 py-2",
			sm: "h-9 rounded-[var(--radius-xs)] px-3 text-xs",
			lg: "h-12 rounded-[var(--radius-md)] px-6 text-base",
			icon: "h-11 w-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
function Card({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-panel)]", className),
		...props
	});
}
function CardHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex flex-col gap-1.5 p-5 pb-0", className),
		...props
	});
}
function CardTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
		className: cn("text-base font-semibold tracking-tight text-[var(--color-fg)]", className),
		...props
	});
}
function CardDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: cn("text-sm text-[var(--color-muted)]", className),
		...props
	});
}
function CardContent({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("p-5", className),
		...props
	});
}
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-subtle)] outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-[var(--color-primary)]/50 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/25 disabled:opacity-50", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var ASSETS = [
	{
		id: "btc",
		ticker: "BTC",
		label: "Bitcoin",
		color: "var(--color-btc)"
	},
	{
		id: "eth",
		ticker: "ETH",
		label: "Ethereum",
		color: "var(--color-eth)"
	},
	{
		id: "sol",
		ticker: "SOL",
		label: "Solana",
		color: "var(--color-sol)"
	},
	{
		id: "avax",
		ticker: "AVAX",
		label: "Avalanche",
		color: "var(--color-avax)"
	},
	{
		id: "link",
		ticker: "LINK",
		label: "Chainlink",
		color: "var(--color-link)"
	},
	{
		id: "dot",
		ticker: "DOT",
		label: "Polkadot",
		color: "var(--color-dot)"
	},
	{
		id: "atom",
		ticker: "ATOM",
		label: "Cosmos",
		color: "var(--color-atom)"
	},
	{
		id: "blok",
		ticker: "bLOkz",
		label: "bLOkz",
		color: "var(--color-blok)"
	}
];
var DIFFICULTIES = {
	easy: {
		id: "easy",
		label: "Genesis",
		size: 4,
		timeLimit: 90,
		extraEdges: 2,
		description: "4×4 chain · 90s"
	},
	medium: {
		id: "medium",
		label: "Validator",
		size: 5,
		timeLimit: 120,
		extraEdges: 4,
		description: "5×5 chain · 120s"
	},
	hard: {
		id: "hard",
		label: "Mainnet",
		size: 6,
		timeLimit: 180,
		extraEdges: 7,
		description: "6×6 chain · 180s"
	}
};
var OPPOSITE = {
	[1]: 4,
	[2]: 8,
	[4]: 1,
	[8]: 2
};
var DELTA = {
	[1]: {
		dr: -1,
		dc: 0
	},
	[2]: {
		dr: 0,
		dc: 1
	},
	[4]: {
		dr: 1,
		dc: 0
	},
	[8]: {
		dr: 0,
		dc: -1
	}
};
function rotatePorts(ports, turns = 1) {
	let p = ports & 15;
	const t = (turns % 4 + 4) % 4;
	for (let i = 0; i < t; i++) p = (p << 1 | p >> 3) & 15;
	return p;
}
function idx(row, col, size) {
	return row * size + col;
}
function inBounds(row, col, size) {
	return row >= 0 && col >= 0 && row < size && col < size;
}
function pickAsset(seed) {
	return ASSETS[seed % ASSETS.length].id;
}
function neighbors(i, size) {
	const r = Math.floor(i / size);
	const c = i % size;
	const out = [];
	if (r > 0) out.push(idx(r - 1, c, size));
	if (c < size - 1) out.push(idx(r, c + 1, size));
	if (r < size - 1) out.push(idx(r + 1, c, size));
	if (c > 0) out.push(idx(r, c - 1, size));
	return out;
}
function edgeDir(from, to, size) {
	const fr = Math.floor(from / size);
	const fc = from % size;
	const tr = Math.floor(to / size);
	const tc = to % size;
	if (tr === fr - 1 && tc === fc) return 1;
	if (tr === fr && tc === fc + 1) return 2;
	if (tr === fr + 1 && tc === fc) return 4;
	if (tr === fr && tc === fc - 1) return 8;
	return 0;
}
/** Generate a fully-connected pipe net, then scramble rotations. */
function generateBoard(difficulty, rng = Math.random) {
	const cfg = DIFFICULTIES[difficulty];
	const size = cfg.size;
	const n = size * size;
	const ports = new Array(n).fill(0);
	const visited = /* @__PURE__ */ new Set([0]);
	const frontier = neighbors(0, size).map((to) => ({
		from: 0,
		to
	}));
	while (visited.size < n && frontier.length > 0) {
		const pick = Math.floor(rng() * frontier.length);
		const edge = frontier.splice(pick, 1)[0];
		if (visited.has(edge.to)) continue;
		visited.add(edge.to);
		const d = edgeDir(edge.from, edge.to, size);
		ports[edge.from] |= d;
		ports[edge.to] |= OPPOSITE[d];
		for (const nb of neighbors(edge.to, size)) if (!visited.has(nb)) frontier.push({
			from: edge.to,
			to: nb
		});
	}
	const candidates = [];
	for (let i = 0; i < n; i++) {
		const r = Math.floor(i / size);
		const c = i % size;
		if (c < size - 1) {
			const j = idx(r, c + 1, size);
			if ((ports[i] & 2) === 0) candidates.push({
				a: i,
				b: j,
				d: 2
			});
		}
		if (r < size - 1) {
			const j = idx(r + 1, c, size);
			if ((ports[i] & 4) === 0) candidates.push({
				a: i,
				b: j,
				d: 4
			});
		}
	}
	for (let i = candidates.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[candidates[i], candidates[j]] = [candidates[j], candidates[i]];
	}
	for (let k = 0; k < cfg.extraEdges && k < candidates.length; k++) {
		const e = candidates[k];
		ports[e.a] |= e.d;
		ports[e.b] |= OPPOSITE[e.d];
	}
	const cells = ports.map((p, i) => ({
		ports: p || 2,
		asset: pickAsset(Math.floor(rng() * 1e3) + i * 17)
	}));
	let board = {
		size,
		cells
	};
	for (let attempt = 0; attempt < 40; attempt++) {
		board = {
			size,
			cells: cells.map((cell) => ({
				...cell,
				ports: rotatePorts(cell.ports, Math.floor(rng() * 4))
			}))
		};
		if (!analyzeBoard(board).isSolved) break;
	}
	return board;
}
function rotateCell(board, cellIndex) {
	const cells = board.cells.map((c, i) => i === cellIndex ? {
		...c,
		ports: rotatePorts(c.ports, 1)
	} : c);
	return {
		size: board.size,
		cells
	};
}
function isLinked(board, from, dir) {
	const size = board.size;
	const cell = board.cells[from];
	if (!cell || (cell.ports & dir) === 0) return false;
	const r = Math.floor(from / size);
	const c = from % size;
	const { dr, dc } = DELTA[dir];
	const nr = r + dr;
	const nc = c + dc;
	if (!inBounds(nr, nc, size)) return false;
	const other = board.cells[idx(nr, nc, size)];
	if (!other) return false;
	return (other.ports & OPPOSITE[dir]) !== 0;
}
function analyzeBoard(board) {
	const size = board.size;
	const n = size * size;
	const seen = new Array(n).fill(false);
	let components = 0;
	let openPorts = 0;
	let linkedEdges = 0;
	for (let i = 0; i < n; i++) {
		const cell = board.cells[i];
		for (const dir of [
			1,
			2,
			4,
			8
		]) {
			if ((cell.ports & dir) === 0) continue;
			if (isLinked(board, i, dir)) {
				if (dir === 2 || dir === 4) linkedEdges += 1;
			} else openPorts += 1;
		}
	}
	for (let start = 0; start < n; start++) {
		if (seen[start]) continue;
		components += 1;
		const q = [start];
		seen[start] = true;
		while (q.length) {
			const cur = q.pop();
			for (const dir of [
				1,
				2,
				4,
				8
			]) {
				if (!isLinked(board, cur, dir)) continue;
				const r = Math.floor(cur / size);
				const c = cur % size;
				const { dr, dc } = DELTA[dir];
				const next = idx(r + dr, c + dc, size);
				if (!seen[next]) {
					seen[next] = true;
					q.push(next);
				}
			}
		}
	}
	return {
		components,
		openPorts,
		linkedEdges,
		totalBlocks: n,
		isSolved: components === 1 && openPorts === 0
	};
}
function scoreRun(opts) {
	const cfg = DIFFICULTIES[opts.difficulty];
	const n = cfg.size * cfg.size;
	const base = n * 120;
	const timeBonus = Math.floor(opts.timeLeftSec * 18);
	const moveBudget = n * 2.4;
	const efficiency = Math.max(0, Math.floor((moveBudget - opts.moves) * 25));
	const speed = Math.max(0, Math.floor((cfg.timeLimit - opts.elapsedSec) * 4));
	const diffMul = opts.difficulty === "hard" ? 1.6 : opts.difficulty === "medium" ? 1.25 : 1;
	return Math.floor((base + timeBonus + efficiency + speed) * diffMul);
}
var SEED_SCORES = [
	{
		name: "SatoshiNode",
		score: 18420,
		timeMs: 34200,
		moves: 28,
		difficulty: "hard"
	},
	{
		name: "ChainWitch",
		score: 16210,
		timeMs: 40100,
		moves: 34,
		difficulty: "hard"
	},
	{
		name: "MerkleMike",
		score: 15100,
		timeMs: 28900,
		moves: 22,
		difficulty: "medium"
	},
	{
		name: "BlockBunny",
		score: 14880,
		timeMs: 45500,
		moves: 40,
		difficulty: "hard"
	},
	{
		name: "0xForge",
		score: 13990,
		timeMs: 31200,
		moves: 26,
		difficulty: "medium"
	},
	{
		name: "GaslessGus",
		score: 13220,
		timeMs: 22100,
		moves: 18,
		difficulty: "easy"
	},
	{
		name: "ValidatorVal",
		score: 12840,
		timeMs: 51200,
		moves: 48,
		difficulty: "hard"
	},
	{
		name: "PipePirate",
		score: 12100,
		timeMs: 26800,
		moves: 24,
		difficulty: "medium"
	},
	{
		name: "NonceNinja",
		score: 11850,
		timeMs: 19800,
		moves: 16,
		difficulty: "easy"
	},
	{
		name: "HashHatter",
		score: 11220,
		timeMs: 38900,
		moves: 36,
		difficulty: "medium"
	},
	{
		name: "SlotSurfer",
		score: 10900,
		timeMs: 44100,
		moves: 42,
		difficulty: "hard"
	},
	{
		name: "LayerLucy",
		score: 10440,
		timeMs: 25500,
		moves: 21,
		difficulty: "medium"
	},
	{
		name: "zkZoe",
		score: 10110,
		timeMs: 17600,
		moves: 15,
		difficulty: "easy"
	},
	{
		name: "RollupRon",
		score: 9880,
		timeMs: 47200,
		moves: 45,
		difficulty: "hard"
	},
	{
		name: "BridgeBen",
		score: 9450,
		timeMs: 30100,
		moves: 29,
		difficulty: "medium"
	},
	{
		name: "OracleOli",
		score: 9120,
		timeMs: 21200,
		moves: 19,
		difficulty: "easy"
	},
	{
		name: "MempoolMax",
		score: 8900,
		timeMs: 52300,
		moves: 50,
		difficulty: "hard"
	},
	{
		name: "EpochEve",
		score: 8650,
		timeMs: 33400,
		moves: 31,
		difficulty: "medium"
	},
	{
		name: "StakeSteve",
		score: 8400,
		timeMs: 18900,
		moves: 17,
		difficulty: "easy"
	},
	{
		name: "FinalityFay",
		score: 8120,
		timeMs: 49800,
		moves: 47,
		difficulty: "hard"
	},
	{
		name: "ConsensusCam",
		score: 7900,
		timeMs: 27800,
		moves: 25,
		difficulty: "medium"
	},
	{
		name: "ShardSam",
		score: 7650,
		timeMs: 20400,
		moves: 20,
		difficulty: "easy"
	},
	{
		name: "L2Lila",
		score: 7400,
		timeMs: 55100,
		moves: 52,
		difficulty: "hard"
	},
	{
		name: "ProofPete",
		score: 7180,
		timeMs: 36200,
		moves: 33,
		difficulty: "medium"
	},
	{
		name: "WalletWren",
		score: 6900,
		timeMs: 23100,
		moves: 22,
		difficulty: "easy"
	},
	{
		name: "DaemonDee",
		score: 6650,
		timeMs: 58e3,
		moves: 55,
		difficulty: "hard"
	},
	{
		name: "TuringTess",
		score: 6400,
		timeMs: 31900,
		moves: 30,
		difficulty: "medium"
	},
	{
		name: "HexHunter",
		score: 6180,
		timeMs: 24500,
		moves: 23,
		difficulty: "easy"
	},
	{
		name: "ParityPat",
		score: 5950,
		timeMs: 60200,
		moves: 58,
		difficulty: "hard"
	},
	{
		name: "RelayRay",
		score: 5720,
		timeMs: 35500,
		moves: 32,
		difficulty: "medium"
	},
	{
		name: "BitByte",
		score: 5500,
		timeMs: 26700,
		moves: 24,
		difficulty: "easy"
	},
	{
		name: "TokenTom",
		score: 5280,
		timeMs: 62100,
		moves: 60,
		difficulty: "hard"
	},
	{
		name: "ClipCypher",
		score: 5050,
		timeMs: 38100,
		moves: 35,
		difficulty: "medium"
	},
	{
		name: "MintMaya",
		score: 4820,
		timeMs: 28900,
		moves: 26,
		difficulty: "easy"
	},
	{
		name: "NodeNova",
		score: 4600,
		timeMs: 65500,
		moves: 62,
		difficulty: "hard"
	},
	{
		name: "KeyKira",
		score: 4380,
		timeMs: 40200,
		moves: 37,
		difficulty: "medium"
	},
	{
		name: "AlphaAce",
		score: 4150,
		timeMs: 30100,
		moves: 27,
		difficulty: "easy"
	},
	{
		name: "BetaBolt",
		score: 3920,
		timeMs: 68800,
		moves: 64,
		difficulty: "hard"
	},
	{
		name: "GammaGrid",
		score: 3700,
		timeMs: 42800,
		moves: 39,
		difficulty: "medium"
	},
	{
		name: "DeltaDock",
		score: 3480,
		timeMs: 31500,
		moves: 28,
		difficulty: "easy"
	},
	{
		name: "SigmaSync",
		score: 3250,
		timeMs: 71200,
		moves: 66,
		difficulty: "hard"
	},
	{
		name: "OmegaOps",
		score: 3020,
		timeMs: 44900,
		moves: 41,
		difficulty: "medium"
	},
	{
		name: "NanoNed",
		score: 2800,
		timeMs: 33200,
		moves: 29,
		difficulty: "easy"
	},
	{
		name: "PicoPip",
		score: 2580,
		timeMs: 74500,
		moves: 68,
		difficulty: "hard"
	},
	{
		name: "QuantaQ",
		score: 2360,
		timeMs: 47100,
		moves: 43,
		difficulty: "medium"
	},
	{
		name: "FluxFinn",
		score: 2140,
		timeMs: 34800,
		moves: 30,
		difficulty: "easy"
	},
	{
		name: "CoreCara",
		score: 1920,
		timeMs: 77800,
		moves: 70,
		difficulty: "hard"
	},
	{
		name: "MeshMira",
		score: 1700,
		timeMs: 49200,
		moves: 44,
		difficulty: "medium"
	},
	{
		name: "LinkLiam",
		score: 1480,
		timeMs: 36500,
		moves: 31,
		difficulty: "easy"
	},
	{
		name: "RootRae",
		score: 1260,
		timeMs: 81200,
		moves: 72,
		difficulty: "hard"
	}
];
var SEED_CHAT = [
	{
		id: "c1",
		author: "SatoshiNode",
		text: "Just forged a Mainnet chain in under 40s. $bLOkz to the moon.",
		at: Date.now() - 1e3 * 60 * 42,
		staked: 12e3
	},
	{
		id: "c2",
		author: "ChainWitch",
		text: "Staking 5k more. Community validators assemble.",
		at: Date.now() - 1e3 * 60 * 35,
		staked: 8500
	},
	{
		id: "c3",
		author: "ValidatorVal",
		text: "Tip: rotate corners first, then straighten the spine of the chain.",
		at: Date.now() - 1e3 * 60 * 28,
		staked: 4200
	},
	{
		id: "c4",
		author: "0xForge",
		text: "Anyone else getting perfect closes on Validator tier?",
		at: Date.now() - 1e3 * 60 * 18,
		staked: 3100
	},
	{
		id: "c5",
		author: "zkZoe",
		text: "bLOK CHaiN hits different when the whole board snaps solid.",
		at: Date.now() - 1e3 * 60 * 9,
		staked: 2500
	}
];
function uid(prefix) {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}
function seedBoards() {
	const withIds = SEED_SCORES.map((e, i) => ({
		...e,
		id: `seed_${i}`,
		at: Date.now() - i * 864e5
	}));
	return {
		scoreboard: [...withIds].sort((a, b) => b.score - a.score).slice(0, 50),
		timeboard: [...withIds].filter((e) => e.timeMs > 0).sort((a, b) => a.timeMs - b.timeMs).slice(0, 50)
	};
}
var seeds = seedBoards();
var useGameStore = create()(persist((set, get) => ({
	playerName: "You",
	setPlayerName: (name) => set({ playerName: name.slice(0, 18) || "You" }),
	tab: "play",
	setTab: (tab) => set({ tab }),
	balance: 1e3,
	staked: 0,
	stake: (amount) => {
		const a = Math.floor(amount);
		if (!Number.isFinite(a) || a <= 0) return {
			ok: false,
			error: "Enter a positive amount"
		};
		const { balance, staked } = get();
		if (a > balance) return {
			ok: false,
			error: "Insufficient $bLOkz balance"
		};
		set({
			balance: balance - a,
			staked: staked + a
		});
		return { ok: true };
	},
	unstake: (amount) => {
		const a = Math.floor(amount);
		if (!Number.isFinite(a) || a <= 0) return {
			ok: false,
			error: "Enter a positive amount"
		};
		const { balance, staked } = get();
		if (a > staked) return {
			ok: false,
			error: "Not enough staked"
		};
		set({
			balance: balance + a,
			staked: staked - a
		});
		return { ok: true };
	},
	awardTokens: (amount) => {
		const a = Math.max(0, Math.floor(amount));
		if (a <= 0) return;
		set({ balance: get().balance + a });
	},
	difficulty: "easy",
	setDifficulty: (d) => set({ difficulty: d }),
	phase: "menu",
	board: null,
	moves: 0,
	startedAt: null,
	endsAt: null,
	lastResult: null,
	lastScore: 0,
	lastTimeMs: 0,
	startGame: () => {
		const { difficulty } = get();
		const cfg = DIFFICULTIES[difficulty];
		const board = generateBoard(difficulty);
		const now = Date.now();
		set({
			phase: "playing",
			board,
			moves: 0,
			startedAt: now,
			endsAt: now + cfg.timeLimit * 1e3,
			lastResult: analyzeBoard(board),
			lastScore: 0,
			lastTimeMs: 0,
			tab: "play"
		});
	},
	rotateAt: (index) => {
		const state = get();
		if (state.phase !== "playing" || !state.board) return;
		if (Date.now() >= (state.endsAt ?? 0)) {
			get().tick();
			return;
		}
		const board = rotateCell(state.board, index);
		const result = analyzeBoard(board);
		const moves = state.moves + 1;
		set({
			board,
			moves,
			lastResult: result
		});
		if (result.isSolved) {
			const startedAt = state.startedAt ?? Date.now();
			const elapsedMs = Date.now() - startedAt;
			const timeLeftSec = Math.max(0, ((state.endsAt ?? Date.now()) - Date.now()) / 1e3);
			const score = scoreRun({
				difficulty: state.difficulty,
				timeLeftSec,
				moves,
				elapsedSec: elapsedMs / 1e3
			});
			const reward = Math.max(25, Math.floor(score / 80));
			set({
				phase: "won",
				lastScore: score,
				lastTimeMs: elapsedMs,
				balance: state.balance + reward
			});
			get().submitScore({
				name: state.playerName,
				score,
				timeMs: elapsedMs,
				moves,
				difficulty: state.difficulty
			});
		}
	},
	tick: () => {
		const state = get();
		if (state.phase !== "playing" || !state.endsAt) return;
		if (Date.now() >= state.endsAt) set({
			phase: "lost",
			lastScore: 0,
			lastTimeMs: (state.endsAt ?? Date.now()) - (state.startedAt ?? Date.now())
		});
	},
	forfeit: () => {
		const state = get();
		if (state.phase !== "playing") return;
		set({
			phase: "lost",
			lastScore: 0,
			lastTimeMs: Date.now() - (state.startedAt ?? Date.now())
		});
	},
	backToMenu: () => set({
		phase: "menu",
		board: null,
		moves: 0,
		startedAt: null,
		endsAt: null
	}),
	scoreboard: seeds.scoreboard,
	timeboard: seeds.timeboard,
	submitScore: (entry) => {
		const full = {
			...entry,
			id: uid("lb"),
			at: Date.now()
		};
		set((s) => {
			return {
				scoreboard: [full, ...s.scoreboard].sort((a, b) => b.score - a.score).slice(0, 50),
				timeboard: [full, ...s.timeboard].filter((e) => e.timeMs > 0).sort((a, b) => a.timeMs - b.timeMs).slice(0, 50)
			};
		});
	},
	chat: SEED_CHAT,
	postChat: (text) => {
		const cleaned = text.trim().slice(0, 240);
		if (!cleaned) return {
			ok: false,
			error: "Message is empty"
		};
		const { staked, playerName, chat } = get();
		if (staked <= 0) return {
			ok: false,
			error: "Stake $bLOkz to post in the validator chat"
		};
		const msg = {
			id: uid("chat"),
			author: playerName,
			text: cleaned,
			at: Date.now(),
			staked
		};
		set({ chat: [...chat, msg].slice(-200) });
		return { ok: true };
	}
}), {
	name: "blok-chain-v1",
	partialize: (s) => ({
		playerName: s.playerName,
		balance: s.balance,
		staked: s.staked,
		difficulty: s.difficulty,
		scoreboard: s.scoreboard,
		timeboard: s.timeboard,
		chat: s.chat
	})
}));
function ChatPanel() {
	const chat = useGameStore((s) => s.chat);
	const staked = useGameStore((s) => s.staked);
	const postChat = useGameStore((s) => s.postChat);
	const [text, setText] = (0, import_react.useState)("");
	const bottomRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [chat.length]);
	const send = () => {
		const res = postChat(text);
		if (!res.ok) toast.error(res.error);
		else setText("");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-4 w-4 text-[var(--color-primary)]" }), "Validator Chat"]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Comments from stakers securing the bLOK CHaiN community pool." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-4",
		children: [
			staked <= 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-[var(--radius-md)] border border-[var(--color-warn)]/25 bg-[var(--color-warn)]/10 px-3 py-3 text-sm text-[var(--color-warn)]",
				children: "Stake $bLOkz to unlock posting. You can still read the room."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-h-[22rem] space-y-3 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3",
				children: [chat.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1.5 flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold",
								children: m.author
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "muted",
								children: [formatNumber(m.staked), " staked"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] text-[var(--color-subtle)]",
								children: new Date(m.at).toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit"
								})
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-[var(--color-muted)]",
						children: m.text
					})]
				}, m.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: bottomRef })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: text,
					onChange: (e) => setText(e.target.value),
					placeholder: staked > 0 ? "Leave a comment for the chain…" : "Stake to comment…",
					disabled: staked <= 0,
					maxLength: 240,
					onKeyDown: (e) => {
						if (e.key === "Enter") send();
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: send,
					disabled: staked <= 0 || !text.trim(),
					size: "icon",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" })
				})]
			})
		]
	})] });
}
function LeaderboardPanel() {
	const scoreboard = useGameStore((s) => s.scoreboard);
	const timeboard = useGameStore((s) => s.timeboard);
	const [kind, setKind] = (0, import_react.useState)("score");
	const [filter, setFilter] = (0, import_react.useState)("all");
	const rows = (0, import_react.useMemo)(() => {
		const src = kind === "score" ? scoreboard : timeboard;
		return (filter === "all" ? src : src.filter((r) => r.difficulty === filter)).slice(0, 50);
	}, [
		scoreboard,
		timeboard,
		kind,
		filter
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "h-4 w-4 text-[var(--color-primary)]" }), "Top 50 Leaderboards"]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Ranked forge runs for score and completion time. Your clears auto-post." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: kind === "score" ? "default" : "secondary",
					onClick: () => setKind("score"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "h-3.5 w-3.5" }), "Score"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: kind === "time" ? "default" : "secondary",
					onClick: () => setKind("time"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { className: "h-3.5 w-3.5" }), "Time"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					"all",
					"easy",
					"medium",
					"hard"
				].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: filter === d ? "outline" : "ghost",
					onClick: () => setFilter(d),
					children: d === "all" ? "All tiers" : DIFFICULTIES[d].label
				}, d))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-[2rem_1fr_auto_auto] gap-2 border-b border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-[11px] uppercase tracking-wide text-[var(--color-subtle)] sm:grid-cols-[2.5rem_1fr_auto_auto_auto_auto]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "#" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Gamer" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Tier"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Moves"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: kind === "score" ? "Score" : "Time" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-right",
							children: kind === "score" ? "Time" : "Score"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "max-h-[28rem] overflow-y-auto",
					children: [rows.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: cn("grid grid-cols-[2rem_1fr_auto_auto] items-center gap-2 border-b border-[var(--color-border)]/70 px-3 py-2.5 text-sm last:border-0 sm:grid-cols-[2.5rem_1fr_auto_auto_auto_auto]", i < 3 && "bg-[var(--color-primary)]/[0.04]"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular text-[var(--color-muted)]",
								children: i + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate font-medium",
								children: row.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "muted",
									children: DIFFICULTIES[row.difficulty].label
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden tabular text-[var(--color-muted)] sm:inline",
								children: row.moves
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular font-semibold text-[var(--color-primary)]",
								children: kind === "score" ? formatNumber(row.score) : formatTime(row.timeMs / 1e3)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-right tabular text-[var(--color-muted)]",
								children: kind === "score" ? formatTime(row.timeMs / 1e3) : formatNumber(row.score)
							})
						]
					}, row.id)), rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "px-3 py-8 text-center text-sm text-[var(--color-muted)]",
						children: "No runs yet for this filter."
					})]
				})]
			})
		]
	})] });
}
function PortArm({ dir, linked, color }) {
	const base = "absolute rounded-full transition-[background-color,box-shadow,opacity] duration-150";
	const on = linked ? "opacity-100 shadow-[0_0_10px_color-mix(in_oklab,var(--arm)_55%,transparent)]" : "opacity-70";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `${base} ${{
			n: "left-1/2 top-0 h-[42%] w-[22%] -translate-x-1/2 origin-top",
			e: "right-0 top-1/2 h-[22%] w-[42%] -translate-y-1/2 origin-right",
			s: "left-1/2 bottom-0 h-[42%] w-[22%] -translate-x-1/2 origin-bottom",
			w: "left-0 top-1/2 h-[22%] w-[42%] -translate-y-1/2 origin-left"
		}[dir]} ${on}`,
		style: {
			background: color,
			["--arm"]: color
		}
	});
}
function BlockTile({ cell, linked, onRotate, disabled, highlight, sizePx }) {
	const asset = ASSETS.find((a) => a.id === cell.asset) ?? ASSETS[7];
	const has = (d) => (cell.ports & d) !== 0;
	const font = Math.max(9, Math.floor(sizePx * .18));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		disabled,
		onClick: onRotate,
		"aria-label": `Rotate ${asset.ticker} block`,
		className: cn("relative flex items-center justify-center rounded-[calc(var(--radius-sm)+2px)] border bg-[var(--color-elevated)] transition-[border-color,transform,box-shadow] duration-150 ease-out select-none touch-manipulation", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40", "hover:border-[var(--color-border-strong)] active:scale-[0.96]", highlight ? "border-[var(--color-primary)] shadow-[0_0_0_1px_var(--color-primary)]" : "border-[var(--color-border)]", disabled && "opacity-80"),
		style: {
			width: sizePx,
			height: sizePx
		},
		children: [
			has(1) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortArm, {
				dir: "n",
				linked: linked.n,
				color: asset.color
			}),
			has(2) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortArm, {
				dir: "e",
				linked: linked.e,
				color: asset.color
			}),
			has(4) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortArm, {
				dir: "s",
				linked: linked.s,
				color: asset.color
			}),
			has(8) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortArm, {
				dir: "w",
				linked: linked.w,
				color: asset.color
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "relative z-10 flex h-[44%] w-[44%] items-center justify-center rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-surface)] font-semibold tracking-tight",
				style: {
					color: asset.color,
					fontSize: font
				},
				children: asset.ticker === "bLOkz" ? "bL" : asset.ticker.slice(0, 3)
			})
		]
	});
}
function GameBoard({ board, onRotate, disabled, solved }) {
	const [tilePx, setTilePx] = (0, import_react.useState)(64);
	(0, import_react.useEffect)(() => {
		const measure = () => {
			const vw = Math.min(window.innerWidth - 32, 560);
			const px = Math.floor((vw - 6 * (board.size - 1)) / board.size);
			setTilePx(Math.max(44, Math.min(78, px)));
		};
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, [board.size]);
	const links = (0, import_react.useMemo)(() => {
		return board.cells.map((_, i) => ({
			n: isLinked(board, i, 1),
			e: isLinked(board, i, 2),
			s: isLinked(board, i, 4),
			w: isLinked(board, i, 8)
		}));
	}, [board]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("mx-auto grid w-fit gap-1.5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 sm:p-4", solved && "ring-1 ring-[var(--color-primary)]/50"),
		style: { gridTemplateColumns: `repeat(${board.size}, ${tilePx}px)` },
		children: board.cells.map((cell, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlockTile, {
			cell,
			linked: links[i],
			onRotate: () => onRotate(i),
			disabled,
			highlight: solved,
			sizePx: tilePx
		}, i))
	});
}
function Hud({ difficulty, timeLeft, moves, result }) {
	const cfg = DIFFICULTIES[difficulty];
	const urgent = timeLeft <= 15;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { className: "h-3.5 w-3.5" }),
				label: "Time",
				value: formatTime(timeLeft),
				warn: urgent
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Move, { className: "h-3.5 w-3.5" }),
				label: "Moves",
				value: formatNumber(moves)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "h-3.5 w-3.5" }),
				label: "Segments",
				value: formatNumber(result?.components ?? 0)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-3.5 w-3.5" }),
				label: "Open ports",
				value: formatNumber(result?.openPorts ?? 0)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "col-span-2 flex flex-wrap items-center gap-2 sm:col-span-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "muted",
					children: cfg.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-[var(--color-muted)]",
					children: "Forge one solid chain — every port must link, one component only."
				})]
			})
		]
	});
}
function Stat({ icon, label, value, warn }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--color-subtle)]",
			children: [icon, label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `text-lg font-semibold tabular tracking-tight ${warn ? "text-[var(--color-danger)]" : "text-[var(--color-fg)]"}`,
			children: value
		})]
	});
}
function PlayPanel() {
	const phase = useGameStore((s) => s.phase);
	const board = useGameStore((s) => s.board);
	const difficulty = useGameStore((s) => s.difficulty);
	const setDifficulty = useGameStore((s) => s.setDifficulty);
	const startGame = useGameStore((s) => s.startGame);
	const rotateAt = useGameStore((s) => s.rotateAt);
	const tick = useGameStore((s) => s.tick);
	const forfeit = useGameStore((s) => s.forfeit);
	const backToMenu = useGameStore((s) => s.backToMenu);
	const moves = useGameStore((s) => s.moves);
	const endsAt = useGameStore((s) => s.endsAt);
	const lastResult = useGameStore((s) => s.lastResult);
	const lastScore = useGameStore((s) => s.lastScore);
	const lastTimeMs = useGameStore((s) => s.lastTimeMs);
	const playerName = useGameStore((s) => s.playerName);
	const setPlayerName = useGameStore((s) => s.setPlayerName);
	const balance = useGameStore((s) => s.balance);
	const [now, setNow] = (0, import_react.useState)(Date.now());
	(0, import_react.useEffect)(() => {
		if (phase !== "playing") return;
		const id = window.setInterval(() => {
			setNow(Date.now());
			tick();
		}, 200);
		return () => window.clearInterval(id);
	}, [phase, tick]);
	const timeLeft = endsAt ? Math.max(0, (endsAt - now) / 1e3) : 0;
	if (phase === "menu") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
			className: "text-xl tracking-tight sm:text-2xl",
			children: "Compile random blocks into one solid chain"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardDescription, {
			className: "max-w-2xl text-pretty",
			children: [
				"Each tile is a protocol asset with connection ports. Tap to rotate. Close every open port so the whole grid becomes a single solid",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[var(--color-primary)]",
					children: "bLOK CHaiN"
				}),
				". Timed ranked runs. Earn $bLOkz on clears."
			]
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]",
							children: "Display name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: playerName,
							onChange: (e) => setPlayerName(e.target.value),
							maxLength: 18,
							placeholder: "Your handle"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] uppercase tracking-wide text-[var(--color-subtle)]",
							children: "Wallet"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "font-semibold tabular text-[var(--color-primary)]",
							children: [formatNumber(balance), " $bLOkz"]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]",
						children: "Difficulty tier"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-2 sm:grid-cols-3",
						children: Object.keys(DIFFICULTIES).map((id) => {
							const d = DIFFICULTIES[id];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setDifficulty(id),
								className: cn("rounded-[var(--radius-lg)] border p-4 text-left transition-[border-color,background-color] duration-150", difficulty === id ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-[var(--color-border)] bg-[var(--color-elevated)] hover:border-[var(--color-border-strong)]"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mb-1 font-semibold",
									children: d.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-[var(--color-muted)]",
									children: d.description
								})]
							}, id);
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					children: ASSETS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "muted",
						className: "gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "inline-block h-2 w-2 rounded-full",
							style: { background: a.color }
						}), a.ticker]
					}, a.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "lg",
					className: "w-full sm:w-auto",
					onClick: startGame,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-4 w-4" }), "Start forge"]
				})
			]
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "grid gap-3 p-5 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowStep, {
					n: "01",
					title: "Rotate",
					body: "Tap any block to turn its ports 90°."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowStep, {
					n: "02",
					title: "Link",
					body: "Matching ports fuse into a live chain segment."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowStep, {
					n: "03",
					title: "Solidify",
					body: "One component, zero open ports — chain complete."
				})
			]
		}) })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "space-y-4 p-4 sm:p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, {
					difficulty,
					timeLeft,
					moves,
					result: lastResult
				}),
				board && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameBoard, {
					board,
					onRotate: rotateAt,
					disabled: phase !== "playing",
					solved: phase === "won"
				}),
				phase === "playing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap justify-center gap-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "danger",
						size: "sm",
						onClick: forfeit,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "h-3.5 w-3.5" }), "Forfeit"]
					})
				})
			]
		}) }), (phase === "won" || phase === "lost") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "border-[var(--color-primary)]/30",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "flex items-center gap-2",
				children: phase === "won" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4 text-[var(--color-primary)]" }), "Chain solidified"] }) : "Forge incomplete"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: phase === "won" ? "Every port sealed. One solid bLOK CHaiN. Score posted to the top 50." : "Time expired or run aborted. Recompile and try again." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EndStat, {
							label: "Score",
							value: formatNumber(lastScore)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EndStat, {
							label: "Time",
							value: formatTime(lastTimeMs / 1e3)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EndStat, {
							label: "Moves",
							value: formatNumber(moves)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EndStat, {
							label: "Reward",
							value: phase === "won" ? `+${formatNumber(Math.max(25, Math.floor(lastScore / 80)))} $bLOkz` : "—"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 sm:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: startGame,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-4 w-4" }), "Play again"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: backToMenu,
						children: "Back to menu"
					})]
				})]
			})]
		})]
	});
}
function HowStep({ n, title, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-primary)]",
			children: n
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-1 font-semibold",
			children: title
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-[var(--color-muted)]",
			children: body
		})
	] });
}
function EndStat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[11px] uppercase tracking-wide text-[var(--color-subtle)]",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-base font-semibold tabular",
			children: value
		})]
	});
}
function StakePanel() {
	const balance = useGameStore((s) => s.balance);
	const staked = useGameStore((s) => s.staked);
	const stake = useGameStore((s) => s.stake);
	const unstake = useGameStore((s) => s.unstake);
	const [amount, setAmount] = (0, import_react.useState)("100");
	const n = Math.floor(Number(amount) || 0);
	const total = balance + staked;
	const pct = total > 0 ? Math.min(100, staked / total * 100) : 0;
	const onStake = () => {
		const res = stake(n);
		if (!res.ok) toast.error(res.error);
		else toast.success(`Staked ${formatNumber(n)} $bLOkz`);
	};
	const onUnstake = () => {
		const res = unstake(n);
		if (!res.ok) toast.error(res.error);
		else toast.success(`Unstaked ${formatNumber(n)} $bLOkz`);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { className: "h-4 w-4 text-[var(--color-primary)]" }), "Stake $bLOkz"]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Lock tokens with the community to unlock the validator chatroom and earn prestige on the chain." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Wallet",
						value: `${formatNumber(balance)} $bLOkz`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Staked",
						value: `${formatNumber(staked)} $bLOkz`,
						accent: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Network share",
						value: `${pct.toFixed(1)}%`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-2 overflow-hidden rounded-full bg-[var(--color-elevated)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300",
					style: { width: `${pct}%` }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]",
						children: "Amount"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						min: 1,
						value: amount,
						onChange: (e) => setAmount(e.target.value),
						placeholder: "100"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [[
							50,
							100,
							250,
							500
						].map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => setAmount(String(q)),
							children: q
						}, q)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => setAmount(String(balance)),
							children: "Max wallet"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "flex-1",
							onClick: onStake,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4" }), "Stake"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "flex-1",
							variant: "secondary",
							onClick: onUnstake,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockOpen, { className: "h-4 w-4" }), "Unstake"]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]",
				children: staked > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "success",
					children: "Validator access"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Chatroom unlocked. Speak for the chain." })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "warn",
					children: "Stake required"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Stake any amount of $bLOkz to post in community chat." })] })
			})
		]
	})] });
}
function Metric({ label, value, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-1 text-[11px] uppercase tracking-wide text-[var(--color-subtle)]",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `text-base font-semibold tabular ${accent ? "text-[var(--color-primary)]" : "text-[var(--color-fg)]"}`,
			children: value
		})]
	});
}
var TABS = [
	{
		id: "play",
		label: "Forge",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Blocks, { className: "h-4 w-4" })
	},
	{
		id: "leaderboard",
		label: "Top 50",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "h-4 w-4" })
	},
	{
		id: "stake",
		label: "Stake",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { className: "h-4 w-4" })
	},
	{
		id: "chat",
		label: "Chat",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-4 w-4" })
	}
];
function AppShell() {
	const tab = useGameStore((s) => s.tab);
	const setTab = useGameStore((s) => s.setTab);
	const balance = useGameStore((s) => s.balance);
	const staked = useGameStore((s) => s.staked);
	const playerName = useGameStore((s) => s.playerName);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none fixed inset-0 -z-10",
				style: { background: "radial-gradient(900px 420px at 12% -10%, color-mix(in oklab, var(--color-primary) 12%, transparent), transparent 60%), radial-gradient(700px 360px at 100% 0%, color-mix(in oklab, var(--color-chain) 8%, transparent), transparent 55%)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-20 border-b border-[var(--color-border)]/80 bg-[var(--color-bg)]/90 backdrop-blur-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-w-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Blocks, { className: "h-4 w-4 text-[var(--color-primary)]" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "truncate text-base font-semibold tracking-tight sm:text-lg",
									children: "bLOK CHaiN"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-[11px] text-[var(--color-muted)]",
									children: "$bLOkz protocol puzzle"
								})]
							})]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "muted",
								className: "hidden max-w-[8rem] truncate sm:inline-flex",
								children: playerName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs sm:px-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-3.5 w-3.5 text-[var(--color-primary)]" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "tabular font-semibold text-[var(--color-primary)]",
										children: formatNumber(balance)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden text-[var(--color-muted)] sm:inline",
										children: "$bLOkz"
									})
								]
							}),
							staked > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "success",
								className: "hidden sm:inline-flex",
								children: [formatNumber(staked), " staked"]
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-3 sm:px-6",
					children: TABS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: tab === t.id ? "default" : "ghost",
						className: cn("shrink-0", tab !== t.id && "text-[var(--color-muted)]"),
						onClick: () => setTab(t.id),
						children: [t.icon, t.label]
					}, t.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8",
				children: [
					tab === "play" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayPanel, {}),
					tab === "leaderboard" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeaderboardPanel, {}),
					tab === "stake" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StakePanel, {}),
					tab === "chat" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatPanel, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "mx-auto max-w-5xl px-4 pb-8 text-center text-xs text-[var(--color-subtle)] sm:px-6",
				children: "bLOK CHaiN · forge solid chains · collect & stake $bLOkz · top 50 ranked"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				theme: "dark",
				position: "bottom-center",
				toastOptions: { className: "!bg-[var(--color-surface)] !border-[var(--color-border)] !text-[var(--color-fg)]" }
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
//#endregion
export { Home as component };
