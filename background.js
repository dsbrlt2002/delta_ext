chrome.runtime.onInstalled.addListener((details) =>
{
    if(details.reason !== "install" && details.reason !== "update") return;

    console.log("INSTALLED");

    chrome.webRequest.onCompleted.addListener(async args =>
        {
            const url = args.url;
            console.log("URL: " + url);
            
            chrome.storage.session.set({url});
        },
        {urls: ["https://delta.mil.gov.ua/api/monitor/objects/attachments/*"]}
    );
});