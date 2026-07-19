// Banana Protector Obfuscator (Ultimate Enhanced)
// https://discord.gg/P7n9kAmwv

const HEADER = `--[[ this code it's protected by banana protector    https://discord.gg/P7n9kAmwv ]]`

// ===== NOMBRES ALEATORIOS =====
function randomName() {
  return "_" + Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 1000)
}

// ===== 4 ANTI-ENV LOGGERS =====
const ANTI_ENV_LOGGER_1 = `local p=game.Players.LocalPlayer
local o=p.CameraMinZoomDistance
pcall(function()
p.CameraMinZoomDistance=-5
end)
print(p.CameraMinZoomDistance~=o and"detected"or"pass")`

const ANTI_ENV_LOGGER_2 = `local _envCheck = function()
local _t = {}
local _a = getfenv()
for _k,_v in pairs(_a) do
if _k:match("executor") or _k:match("exploit") or _k:match("syn") or _k:match("krnl") then
while true do end
end
end
end
pcall(_envCheck)`

const ANTI_ENV_LOGGER_3 = `local _hookCheck = function()
local _oldPrint = print
local _test = "check"
print = function() end
local _result = pcall(function() print(_test) end)
print = _oldPrint
if not _result then while true do end end
end
pcall(_hookCheck)`

const ANTI_ENV_LOGGER_4 = `local _debugCheck = function()
if debug and debug.getinfo then
local _info = debug.getinfo(1)
if _info and _info.what == "C" then
while true do end
end
end
end
pcall(_debugCheck)`

// ===== MATH CODE EXTRA (30% más) =====
function extraMathCode(n) {
  if (Math.random() < 0.3) return n.toString();
  let choice = Math.floor(Math.random() * 5)
  if (choice === 0) {
    let a = Math.floor(Math.random() * 100) + 1
    return `((${n}+${a})-${a})`
  } else if (choice === 1) {
    let a = Math.floor(Math.random() * 50) + 1
    let b = Math.floor(Math.random() * 50) + 1
    return `((${n}*${a})/${a}+${b}-${b})`
  } else if (choice === 2) {
    let a = Math.floor(Math.random() * 10) + 1
    return `((${n}<<${a})>>${a})`
  } else if (choice === 3) {
    let a = Math.floor(Math.random() * 20) + 1
    let b = Math.floor(Math.random() * 20) + 1
    return `((${n}+${a})^${b}^${b}-${a})`
  } else {
    let a = Math.floor(Math.random() * 100) + 1
    let b = Math.floor(Math.random() * 100) + 1
    return `((((${n}+${a})*${b})/${b})-${a})`
  }
}

function heavyMath(n) {
  if (Math.random() < 0.5) return n.toString();
  let a = Math.floor(Math.random() * 3000) + 500
  let b = Math.floor(Math.random() * 50) + 2
  let c = Math.floor(Math.random() * 800) + 10
  let d = Math.floor(Math.random() * 20) + 2
  return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`
}

function mba() {
  let n = Math.random() > 0.5 ? 1 : 2, a = Math.floor(Math.random() * 70) + 15, b = Math.floor(Math.random() * 40) + 8;
  return `((${n}*${a}-${a})/(${b}+1)+${n})`;
}

function pickHandlers(count) {
  const used = new Set()
  const result = []
  while (result.length < count) {
    const name = randomName() + Math.floor(Math.random() * 99)
    if (!used.has(name)) { used.add(name); result.push(name) }
  }
  return result
}

const MAPEO = {
  "ScreenGui":"Aggressive Renaming","Frame":"String to Math","TextLabel":"Table Indirection",
  "TextButton":"Mixed Boolean Arithmetic","Humanoid":"Dynamic Junk","Player":"Fake Flow",
  "RunService":"Virtual Machine","TweenService":"Fake Flow","Players":"Fake Flow"
};

function detectAndApplyMappings(code) {
  let modified = code, headers = "";
  for (const [word, tech] of Object.entries(MAPEO)) {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    if (regex.test(modified)) {
      let replacement = `"${word}"`;
      if (tech.includes("Aggressive Renaming")) { const v = randomName(); headers += `local ${v}="${word}";`; replacement = v; }
      else if (tech.includes("String to Math")) replacement = `string.char(${word.split('').map(c => extraMathCode(heavyMath(c.charCodeAt(0)))).join(',')})`;
      else if (tech.includes("Mixed Boolean Arithmetic")) replacement = `((${mba()}==1 or true)and"${word}")`;
      regex.lastIndex = 0;
      modified = modified.replace(regex, (match) => `game[${replacement}]`);
    }
  }
  return headers + modified;
}

// ===== JUNK CODE MEJORADO =====
function generateSingleJunkLine() {
  const r = Math.random()
  if (r < 0.15) return `local ${randomName()}=${heavyMath(Math.floor(Math.random() * 999))} `
  else if (r < 0.25) return `local ${randomName()}=string.char(${heavyMath(Math.floor(Math.random()*255))}) `
  else if (r < 0.35) return `local ${randomName()}={} ${randomName()}["${randomName()}"]=1 `
  else if (r < 0.45) return `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `
  else if (r < 0.55) {
    const tp = randomName();
    return `if type(nil)=="number" then while true do local ${tp}=1 end end `
  } else if (r < 0.65) {
    const vt = randomName();
    return `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end `
  } else if (r < 0.75) {
    return `local function ${randomName()}() return ${heavyMath(Math.floor(Math.random()*100))} end `
  } else if (r < 0.85) {
    return `local ${randomName()}=${randomName()} or {} `
  } else {
    return `if type(math.pi)=="string" then while true do end end `
  }
}

function generateJunk(lines = 150) {
  let j = ''
  for (let i = 0; i < lines; i++) j += generateSingleJunkLine()
  return j
}

function applyCFF(blocks) {
  const stateVar = randomName()
  let lua = `local ${stateVar}=${heavyMath(1)} while true do `
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) lua += `if ${stateVar}==${heavyMath(1)} then ${blocks[i]} ${stateVar}=${heavyMath(2)} `
    else lua += `elseif ${stateVar}==${heavyMath(i + 1)} then ${blocks[i]} ${stateVar}=${heavyMath(i + 2)} `
  }
  lua += `elseif ${stateVar}==${heavyMath(blocks.length + 1)} then break end end `
  return lua
}

function runtimeString(str) {
  return `string.char(${str.split('').map(c => extraMathCode(heavyMath(c.charCodeAt(0)))).join(',')})`;
}

// ===== CUSTOM DEBUG MACHINE =====
function customDebugMachine() {
  let code = '';
  const dbgName = randomName();
  code += `local ${dbgName}=function() local x=0; for i=1,1000 do x=x+math.sin(i)*math.cos(i) end return x end `
  code += `if debug and debug.getinfo then local _old=debug.getinfo; debug.getinfo=function(...) return {what="C"} end end `
  code += `if type(os.clock)=="number" then local _z=1 end `
  code += `if debug then debug.sethook = function() end end `
  return code;
}

// ===== ANTI-HOOK Y ANTI-TAMPER =====
function antiHookAndTamper() {
  let code = '';
  code += `local _funcs = {print, warn, error, pcall} `
  code += `for _, _f in ipairs(_funcs) do `
  code += `if type(_f)~="function" then while true do end end `
  code += `end `
  code += `local _tostring = tostring `
  code += `if type(_tostring)~="function" then while true do end end `
  code += `local _type = type `
  code += `if type(_type)~="function" then while true do end end `
  return code;
}

// ===== TRUE VM (XOR) =====
function buildTrueVM(payloadStr) {
  const STACK = randomName()
  const KEY = randomName()
  const ORDER = randomName()
  const seed = Math.floor(Math.random() * 200) + 50

  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} `
  const chunkSize = 10
  let realChunks = []
  for(let i = 0; i < payloadStr.length; i += chunkSize)
    realChunks.push(payloadStr.slice(i, i + chunkSize))

  let poolVars = [], realOrder = [], totalChunks = realChunks.length * 4, currentReal = 0, globalIndex = 0

  for(let i = 0; i < totalChunks; i++) {
    let memName = randomName()
    poolVars.push(memName)
    if (currentReal < realChunks.length && (Math.random() > 0.6 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      let chunk = realChunks[currentReal], encryptedBytes = []
      for(let j = 0; j < chunk.length; j++) {
        let enc = chunk.charCodeAt(j) ^ ((seed + globalIndex) & 0xFF)
        encryptedBytes.push(extraMathCode(heavyMath(enc)))
        globalIndex++
      }
      vmCore += `local ${memName}={${encryptedBytes.join(',')}} `
      currentReal++
    } else {
      let fakeBytes = []
      for(let j = 0; j < Math.floor(Math.random() * 25) + 5; j++)
        fakeBytes.push(extraMathCode(heavyMath(Math.floor(Math.random() * 255))))
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `
    }
  }

  vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => extraMathCode(heavyMath(n))).join(',')}} `
  const idxVar = randomName(), byteVar = randomName()

  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `
  vmCore += `table.insert(${STACK}, string.char(bit32.bxor(${byteVar}, (${KEY} + _gIdx) % 256))) _gIdx=_gIdx+1 end end `
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `

  const ASSERT = `getfenv()[${runtimeString("assert")}]`
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`
  const GAME = `getfenv()[${runtimeString("game")}]`
  const HTTPGET = runtimeString("HttpGet")

  if (payloadStr.includes("http"))
    vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME}, _e)))() `
  else
    vmCore += `${ASSERT}(${LOADSTRING}(_e))() `
  return vmCore
}

// ===== SINGLE VM =====
function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount)
  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = randomName()
  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(8)} ${innerCode} end `
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(4)} return nil end `
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++)
    out += `[${extraMathCode(heavyMath(i + 1))}]=${handlers[i]},`
  out += `} `
  let execBlocks = []
  for (let i = 0; i < handlers.length; i++)
    execBlocks.push(`${DISPATCH}[${extraMathCode(heavyMath(i + 1))}](lM)`)
  out += applyCFF(execBlocks)
  return out
}

// ===== 30x VM =====
function build30xVM(payloadStr) {
  let vm = buildTrueVM(payloadStr)
  for (let i = 0; i < 30; i++)
    vm = buildSingleVM(vm, Math.floor(Math.random() * 3) + 2)
  return vm
}

function getExtraProtections() {
  const antiDebuggers =
    `local _adT=os.clock() for _=1,150000 do end if os.clock()-_adT>5.0 then while true do end end ` +
    `if debug~=nil and debug.getinfo then local _i=debug.getinfo(1) if _i.what~="main" and _i.what~="Lua" then while true do end end end ` +
    `local _adOk,_adE=pcall(function() error("__v") end) if not string.find(tostring(_adE),"__v") then while true do end end ` +
    `if getmetatable(_G)~=nil then while true do end end ` +
    `if type(print)~="function" then while true do end end `;

  const rawTampers = [
    `if math.pi<3.14 or math.pi>3.15 then _err() end`,
    `if bit32 and bit32.bxor(10,5)~=15 then _err() end`,
    `if type(tostring)~="function" then _err() end`,
    `if not string.match("chk","^c.*k$") then _err() end`,
    `if type(coroutine.create)~="function" then _err() end`,
    `if type(table.concat)~="function" then _err() end`,
    `local _tm1=tick() local _tm2=tick() if _tm2<_tm1 then _err() end`,
    `if math.abs(-10)~=10 then _err() end`,
    `if gcinfo and gcinfo()<0 then _err() end`,
    `if type(next)~="function" then _err() end`,
    `if string.len("a")~=1 then _err() end`,
    `if type(table.insert)~="function" then _err() end`,
    `if string.byte("Z",1)~=90 then _err() end`,
    `if math.floor(-1/10)~=-1 then _err() end`,
    `if (true and 1 or 2)~=1 then _err() end`,
    `if type(1)~="number" then _err() end`,
    `if type(pcall)~="function" then _err() end`,
    `if type(select)~="function" then _err() end`,
    `if type(unpack)~="function" then _err() end`
  ];

  let codeVaultGuards = "";
  for(let t of rawTampers) {
    const fnName = randomName();
    const errName = randomName();
    const injectedError = t.replace("_err()", `${errName}("!")`);
    codeVaultGuards += `local ${fnName}=function() local ${errName}=error ${injectedError} end ${fnName}() `;
  }

  return antiDebuggers + codeVaultGuards;
}

// ===== ANTI-ENV TABLE =====
function buildAntiEnvTable() {
  const tableName = randomName()
  const initLine = `local ${tableName} = {}`
  const reconstructLine = `local _reco = table.concat(${tableName}); assert(loadstring(_reco))();`
  return `${initLine} ${reconstructLine}`
}

// ===== FUNCIÓN PRINCIPAL =====
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  const antiDebug = `local _t=tick() for _=1,150000 do end if tick()-_t>5.0 then while true do end end `
  const extraProtections = getExtraProtections()
  const debugMachine = customDebugMachine()
  const antiHook = antiHookAndTamper()
  const antiEnvTable = buildAntiEnvTable()

  let payloadToProtect = ""
  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(isLoadstringRegex)
  if (match) { payloadToProtect = match[1] }
  else { payloadToProtect = detectAndApplyMappings(sourceCode) }

  const finalVM = build30xVM(payloadToProtect)

  const result = `${HEADER}
${antiEnvTable}
${ANTI_ENV_LOGGER_1}
${ANTI_ENV_LOGGER_2}
${ANTI_ENV_LOGGER_3}
${ANTI_ENV_LOGGER_4}
${generateJunk(150)}
${antiDebug}
${debugMachine}
${antiHook}
${extraProtections}
${finalVM}`
  return result.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }