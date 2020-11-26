#!/usr/bin/env node
//. /Users/alicefernandes/.zshrc

const minimist = require('minimist');
const puppeteer = require('puppeteer');
const settings = require("./settings.json");

var argv = minimist(process.argv.slice(2));
let { status, toggle } = argv;
//document.querySelector("[data-qa-presence-active]").dataset.qaPresenceActive
//accept args: active, away
function generateCustomStatusScript(status) {
    print("setting status " + status )

    return `let instructions = [()=>{
                document.querySelector(".ql-editor").innerText = "/${status}"
            }
            , ()=>{
                document.querySelector(".c-texty_input__button--send").click()
            }
            ]

            instructions.forEach(function(cb, idx) {
                let i = cb;
                window.setTimeout(i, idx * 1000);
            });`
};


async function isActive(page){
    await page.waitForSelector("[data-qa-presence-active]")
    let r = await page.evaluate(() => {
        return document.querySelector("[data-qa-presence-active]").dataset.qaPresenceActive === "true"
    })
    return r;
}


async function openSlack() {
    print("Opening slack")
    const browser = await puppeteer.launch({headless:true, args: [
        '--window-size=1280,720',
      ],}); // default is true
    
    const page = await browser.newPage();
    page.on('pageerror', (err) => {console.log(err)});

    await page.goto(settings.workspace_url, { waitUntil: 'load' });

    try {
        await page.click("form .btn");
        await page.waitForTimeout('body')
    } catch (e) {
    }
    
    await page.waitForTimeout(2000)
    await page.screenshot({path: 'cenas.png'});

    await page.type('#email', settings.workspace_email, { delay: 20 }); // Types slower, like a user
    await page.type('#password', settings.workspace_pwd, { delay: 20 }); // Types slower, like a user
    await page.evaluate(()=>{
        document.querySelector("#signin_btn").click();
    });
    //await page.waitForNavigation();
    await page.waitForSelector(".ql-editor");
    if(toggle !== undefined){
        await page.waitForTimeout(2000)
        let active = await isActive(page);
        status = active ? "away": "active";
    }
    
    toggleState(page, status);
}

async function toggleState(page, desiredState) {
    if (status != undefined) {
        let customScript = generateCustomStatusScript(desiredState);
        await page.evaluate(customScript);
        await page.waitForTimeout(10 * 1000);
        await page.close()
        process.exit(0)

    }
}

function print(arg) {
    console.log("\u001b[41m", arg, "\u001b[0m")
}


openSlack()