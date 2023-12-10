chrome.runtime.onInstalled.addListener((details) =>
{
    if(details.reason !== "install" && details.reason !== "update") return;

    console.log("INSTALLED");

    chrome.webRequest.onCompleted.addListener(async args =>
        {
            const url = args.url;
            if (args.method == "GET")
            {
                console.log("URL: " + url);
            
                chrome.storage.session.set({url});
            }
        },
        {urls: ["https://delta.mil.gov.ua/api/monitor/objects/attachments/*"]}
    );

    chrome.webRequest.onCompleted.addListener(async args =>
        {
            const url = args.url;
            if (!url.includes("attachments") && args.method == "GET")
            {
                console.log("OBJ: " + url);
                
                chrome.storage.session.set({obj: url});
            }
        },
        {urls: ["https://delta.mil.gov.ua/api/monitor/objects/*"]}
    );
});