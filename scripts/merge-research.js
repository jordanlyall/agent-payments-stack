const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Research data from agent (pasted in)
const research = [
  {"id": "theoriq", "url": "https://www.theoriq.ai", "x": "TheoriqAI", "chain": "Ethereum", "docs": "https://docs.theoriq.ai"},
  {"id": "giza-arma", "url": "https://www.gizatech.xyz", "x": "gizatechxyz", "chain": "Base", "docs": "https://docs.gizatech.xyz"},
  {"id": "almanak", "url": "https://almanak.co", "x": "Almanak__", "chain": "multi", "docs": "https://docs.almanak.co"},
  {"id": "brahma-fi", "url": "https://brahma.fi", "x": "BrahmaFi", "chain": "multi"},
  {"id": "nansen", "url": "https://www.nansen.ai", "x": "nansen_ai", "chain": "multi"},
  {"id": "apify", "url": "https://apify.com", "x": "apify", "docs": "https://docs.apify.com"},
  {"id": "render", "url": "https://rendernetwork.com", "x": "rendernetwork", "chain": "Solana", "docs": "https://know.rendernetwork.com"},
  {"id": "ocean-protocol", "url": "https://oceanprotocol.com", "x": "oceanprotocol", "chain": "multi", "docs": "https://docs.oceanprotocol.com"},
  {"id": "mint-day", "chain": "Base"},
  {"id": "ramp-agent-cards", "url": "https://ramp.com", "x": "tryramp"},
  {"id": "brex", "url": "https://www.brex.com", "x": "brex"},
  {"id": "sponge-gateway", "url": "https://paysponge.com", "x": "sponge_wallet", "docs": "https://docs.paysponge.com"},
  {"id": "payman-ai", "url": "https://paymanai.com", "x": "paymanai", "docs": "https://docs.paymanai.com"},
  {"id": "erc-8004", "url": "https://eips.ethereum.org/EIPS/eip-8004", "chain": "Ethereum"},
  {"id": "ows-policies", "url": "https://openwallet.sh", "chain": "multi"},
  {"id": "visa-intelligent-commerce", "url": "https://corporate.visa.com/en/products/intelligent-commerce.html", "x": "Visa", "docs": "https://developer.visa.com/capabilities/visa-intelligent-commerce"},
  {"id": "crossmint-l4", "url": "https://www.crossmint.com", "x": "crossmint", "chain": "multi", "docs": "https://docs.crossmint.com"},
  {"id": "mastercard-agentic-tokens", "url": "https://www.mastercard.com", "x": "Mastercard"},
  {"id": "x402", "url": "https://www.x402.org", "chain": "multi", "docs": "https://docs.cdp.coinbase.com/x402/welcome"},
  {"id": "tempo-mpp", "url": "https://tempo.xyz", "x": "tempo", "chain": "multi", "docs": "https://docs.tempo.xyz"},
  {"id": "google-ap2", "url": "https://ap2-protocol.org", "chain": "multi"},
  {"id": "acp", "url": "https://www.agenticcommerce.dev", "docs": "https://docs.stripe.com/agentic-commerce/protocol"},
  {"id": "l402-lightning", "docs": "https://docs.lightning.engineering/the-lightning-network/l402"},
  {"id": "atxp", "url": "https://circuitandchisel.com", "chain": "multi"},
  {"id": "fewsats", "url": "https://www.fewsats.com", "x": "fewsats"},
  {"id": "erc-8183", "url": "https://eips.ethereum.org/EIPS/eip-8183", "chain": "Ethereum"},
  {"id": "interledger", "url": "https://interledger.org", "x": "Interledger", "chain": "multi", "docs": "https://interledger.org/developers/get-started"},
  {"id": "x402s-scp", "chain": "Solana"},
  {"id": "skyfire", "url": "https://skyfire.xyz", "x": "trySkyfire", "chain": "Base", "docs": "https://docs.skyfire.xyz"},
  {"id": "mesh", "url": "https://www.meshpay.com", "x": "meshpay", "chain": "multi", "docs": "https://docs.meshconnect.com"},
  {"id": "crossmint-l2", "url": "https://www.crossmint.com", "x": "crossmint", "chain": "multi", "docs": "https://docs.crossmint.com"},
  {"id": "biconomy-dan", "url": "https://www.biconomy.io", "x": "biconomy", "chain": "multi", "docs": "https://docs.biconomy.io"},
  {"id": "bvnk", "url": "https://bvnk.com", "x": "BVNKFinance", "chain": "multi"},
  {"id": "unifold", "url": "https://unifold.io", "x": "unifold_io", "chain": "multi"},
  {"id": "circle-cctp", "url": "https://www.circle.com/cross-chain-transfer-protocol", "x": "circle", "chain": "multi", "docs": "https://developers.circle.com/cctp"},
  {"id": "bridge", "url": "https://www.bridge.xyz", "x": "Stablecoin", "chain": "multi"},
  {"id": "across", "url": "https://across.to", "x": "AcrossProtocol", "chain": "multi", "docs": "https://docs.across.to"},
  {"id": "li-fi", "url": "https://li.fi", "x": "lifiprotocol", "chain": "multi", "docs": "https://docs.li.fi"},
  {"id": "socket", "url": "https://socket.tech", "x": "socketdottech", "chain": "multi", "docs": "https://docs.socket.tech"},
  {"id": "debridge", "url": "https://debridge.finance", "x": "deBridgeFinance", "chain": "multi", "docs": "https://docs.debridge.com"},
  {"id": "wormhole", "url": "https://wormhole.com", "x": "wormhole", "chain": "multi", "docs": "https://wormhole.com/docs"},
  {"id": "layerzero", "url": "https://layerzero.network", "x": "LayerZero_Labs", "chain": "multi", "docs": "https://docs.layerzero.network"},
  {"id": "jupiter", "url": "https://jup.ag", "x": "JupiterExchange", "chain": "Solana", "docs": "https://station.jup.ag/docs"},
  {"id": "1inch", "url": "https://1inch.io", "x": "1inch", "chain": "multi", "docs": "https://docs.1inch.io"},
  {"id": "cow-protocol", "url": "https://cow.fi", "x": "CoWSwap", "chain": "multi", "docs": "https://docs.cow.fi"},
  {"id": "moonpay", "url": "https://www.moonpay.com", "x": "moonpay", "chain": "multi", "docs": "https://dev.moonpay.com"},
  {"id": "moonpay-ows", "url": "https://openwallet.sh", "chain": "multi"},
  {"id": "crossmint-l1", "url": "https://www.crossmint.com", "x": "crossmint", "chain": "multi", "docs": "https://docs.crossmint.com"},
  {"id": "openfort", "url": "https://www.openfort.io", "x": "openfortxyz", "chain": "multi", "docs": "https://www.openfort.io/docs"},
  {"id": "world-agentkit", "url": "https://world.org", "x": "worldcoin", "chain": "multi", "docs": "https://docs.world.org/agents/agent-kit"},
  {"id": "turnkey", "url": "https://www.turnkey.com", "x": "turnkeyhq", "chain": "multi", "docs": "https://docs.turnkey.com"},
  {"id": "privy", "url": "https://www.privy.io", "x": "privy_io", "chain": "multi", "docs": "https://docs.privy.io"},
  {"id": "dynamic", "url": "https://www.dynamic.xyz", "x": "dynamic_xyz", "chain": "multi", "docs": "https://docs.dynamic.xyz"},
  {"id": "lit-protocol", "url": "https://www.litprotocol.com", "x": "LitProtocol", "chain": "multi", "docs": "https://developer.litprotocol.com"},
  {"id": "zerodev", "url": "https://zerodev.app", "x": "zerodev_app", "chain": "multi", "docs": "https://docs.zerodev.app"},
  {"id": "biconomy", "url": "https://www.biconomy.io", "x": "biconomy", "chain": "multi", "docs": "https://docs.biconomy.io"},
  {"id": "alchemy", "url": "https://www.alchemy.com", "x": "AlchemyPlatform", "chain": "multi", "docs": "https://docs.alchemy.com"},
  {"id": "phantom", "url": "https://phantom.com", "x": "phantom", "chain": "Solana", "docs": "https://docs.phantom.com"},
  {"id": "base", "url": "https://base.org", "x": "base", "chain": "Base", "docs": "https://docs.base.org"},
  {"id": "solana", "url": "https://solana.com", "x": "solana", "chain": "Solana", "docs": "https://solana.com/docs"},
  {"id": "ethereum", "url": "https://ethereum.org", "x": "ethereum", "chain": "Ethereum", "docs": "https://ethereum.org/developers/docs"},
  {"id": "tempo", "url": "https://tempo.xyz", "x": "tempo", "docs": "https://docs.tempo.xyz"},
  {"id": "arbitrum", "url": "https://arbitrum.io", "x": "arbitrum", "chain": "Arbitrum", "docs": "https://docs.arbitrum.io"},
  {"id": "sui", "url": "https://sui.io", "x": "SuiNetwork", "docs": "https://docs.sui.io"},
  {"id": "polygon", "url": "https://polygon.technology", "x": "0xPolygon", "docs": "https://docs.polygon.technology"},
  {"id": "bnb-chain", "url": "https://www.bnbchain.org", "x": "BNBCHAIN", "docs": "https://docs.bnbchain.org"},
  {"id": "gnosis", "url": "https://www.gnosis.io", "x": "gnosischain", "docs": "https://docs.gnosischain.com"},
  {"id": "near", "url": "https://near.org", "x": "NEARProtocol", "docs": "https://docs.near.org"},
  {"id": "avalanche", "url": "https://www.avax.network", "x": "avax", "docs": "https://docs.avax.network"},
  {"id": "virtuals-protocol", "url": "https://virtuals.io", "x": "virtuals_io", "chain": "Base", "docs": "https://whitepaper.virtuals.io"},
  {"id": "elizaos", "url": "https://elizaos.ai", "x": "elizaos", "chain": "multi", "docs": "https://docs.elizaos.ai"},
  {"id": "olas", "url": "https://olas.network", "x": "autonolas", "chain": "multi", "docs": "https://docs.autonolas.network"},
  {"id": "botto", "url": "https://botto.com", "x": "bottoproject", "chain": "Ethereum", "docs": "https://docs.botto.com"},
  {"id": "axiom", "url": "https://axiom.trade", "x": "axiom", "chain": "Solana"},
  {"id": "x402engine", "url": "https://x402.org", "x": "x402xyz", "chain": "Base", "docs": "https://docs.cdp.coinbase.com/x402/welcome"},
  {"id": "akash", "url": "https://akash.network", "x": "akashnet_", "chain": "multi", "docs": "https://akash.network/docs"},
  {"id": "art-blocks", "url": "https://artblocks.io", "x": "artblocks_io", "chain": "Ethereum", "docs": "https://docs.artblocks.io"},
  {"id": "run402", "url": "https://run402.com", "chain": "Base"},
  {"id": "cascade", "url": "https://cascade.fyi", "chain": "Solana"},
  {"id": "skyfire-kya", "url": "https://skyfire.xyz", "x": "skyfire_xyz", "chain": "multi", "docs": "https://docs.skyfire.xyz"},
  {"id": "stripe-spts", "url": "https://stripe.com", "x": "stripe", "chain": "multi", "docs": "https://docs.stripe.com/payments/stablecoin-payments"},
  {"id": "agentpay-l4", "url": "https://agent.tech"},
  {"id": "ghostspeak", "url": "https://ghostspeak.io", "chain": "Solana"},
  {"id": "observer-protocol", "url": "https://observerprotocol.org", "chain": "multi"},
  {"id": "superfluid", "url": "https://superfluid.finance", "x": "Superfluid_HQ", "chain": "multi", "docs": "https://docs.superfluid.org"},
  {"id": "agentpay-l3", "url": "https://agent.tech"},
  {"id": "dhali", "url": "https://dhali.io", "x": "dhali_io", "chain": "multi"},
  {"id": "masumi", "url": "https://masumi.network", "x": "MasumiNetwork", "docs": "https://docs.masumi.network"},
  {"id": "backpac", "url": "https://backpac.xyz", "x": "BackpacXYZ", "chain": "multi", "docs": "https://docs.backpac.xyz"},
  {"id": "circle-nanopayments", "url": "https://circle.com", "x": "circle", "chain": "multi", "docs": "https://developers.circle.com"},
  {"id": "reqcast", "url": "https://reqcast.com"},
  {"id": "reveel", "url": "https://reveel.id", "x": "r3vl_xyz", "chain": "multi"},
  {"id": "coinbase-agentic-wallets", "url": "https://coinbase.com", "x": "coinbase", "chain": "multi", "docs": "https://docs.cdp.coinbase.com/agentic-wallet/welcome"},
  {"id": "thirdweb", "url": "https://thirdweb.com", "x": "thirdweb", "chain": "multi", "docs": "https://portal.thirdweb.com"},
  {"id": "safe", "url": "https://safe.global", "x": "safe__global", "chain": "multi", "docs": "https://docs.safe.global"},
  {"id": "walletconnect", "url": "https://walletconnect.com", "x": "WalletConnect", "chain": "multi", "docs": "https://docs.walletconnect.network"},
  {"id": "dfns", "url": "https://dfns.co", "x": "dfnsHQ", "chain": "multi", "docs": "https://docs.dfns.co"},
  {"id": "natural", "url": "https://natural.co"},
  {"id": "fireblocks", "url": "https://fireblocks.com", "x": "FireblocksHQ", "chain": "multi", "docs": "https://developers.fireblocks.com"},
  {"id": "uniswap", "url": "https://uniswap.org", "x": "Uniswap", "chain": "Ethereum", "docs": "https://docs.uniswap.org"},
  {"id": "kite", "url": "https://gokite.ai", "x": "GoKiteAI", "docs": "https://docs.gokite.ai"},
  {"id": "skale", "url": "https://skale.space", "x": "SkaleNetwork", "chain": "Ethereum", "docs": "https://docs.skale.network"},
  {"id": "human402", "url": "https://human402.com"},
  {"id": "kibble", "url": "https://kibble.sh", "chain": "multi"},
  {"id": "kraken-cli", "x": "krakenfx", "chain": "multi"},
  {"id": "agentescrow", "chain": "Base"},
  {"id": "faremeter", "chain": "multi", "docs": "https://docs.corbits.dev/faremeter/overview"}
];

// Build lookup
const researchMap = {};
research.forEach(r => { researchMap[r.id] = r; });

let updated = 0;
let brahmaFixed = false;

for (const layer of data.layers) {
  for (const p of layer.projects) {
    const r = researchMap[p.id];
    if (!r) continue;

    let changed = false;

    // Fill in missing fields — don't overwrite existing non-null values
    // Exception: `chain` — if existing is already an array with real data, keep it
    if (r.url && !p.url) { p.url = r.url; changed = true; }
    if (r.x && !p.x) { p.x = r.x; changed = true; }
    if (r.docs && !p.docs) { p.docs = r.docs; changed = true; }

    // chain: only fill if missing. Don't overwrite existing arrays.
    if (r.chain && !p.chain) { p.chain = r.chain; changed = true; }

    // Special: brahma-fi acquired by Polymarket (March 2026)
    if (p.id === 'brahma-fi' && p.status !== 'acquired') {
      p.status = 'acquired';
      p.history = p.history || [];
      p.history.push({ date: '2026-03', event: 'acquired', acquirer: 'Polymarket' });
      changed = true;
      brahmaFixed = true;
    }

    if (changed) updated++;
  }
}

// Update schema metadata
data.updated = new Date().toISOString().slice(0, 10);

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Updated ${updated} projects`);
if (brahmaFixed) console.log('brahma-fi: marked acquired by Polymarket');

// Coverage stats
let hasUrl = 0, hasX = 0, hasChain = 0, hasDocs = 0, total = 0;
for (const layer of data.layers) {
  for (const p of layer.projects) {
    total++;
    if (p.url) hasUrl++;
    if (p.x) hasX++;
    if (p.chain) hasChain++;
    if (p.docs) hasDocs++;
  }
}
console.log(`\nCoverage after merge (${total} projects):`);
console.log(`  url:   ${hasUrl}/${total}`);
console.log(`  x:     ${hasX}/${total}`);
console.log(`  chain: ${hasChain}/${total}`);
console.log(`  docs:  ${hasDocs}/${total}`);
