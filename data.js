const defaultData = {
  "groups": [
    {
      "id": "g1",
      "title": "StoryPress",
      "links": [
        { "id": "l1", "name": "StoryPress.app", "url": "https://storypress.app/" },
        { "id": "l2", "name": "StoryPress stg", "url": "https://staging.storypress.pages.dev/" },
        {
          "id": "l3",
          "name": "New Accounts",
          "type": "list",
          "links": [
            { "name": "Cloudflare Sign up", "url": "https://dash.cloudflare.com/sign-up" },
            { "name": "Supabase", "url": "https://supabase.com/" },
            { "name": "StoryPress Add Credentials", "url": "https://staging.storypress.pages.dev/add-credentials" },
            { "name": "Storyblok", "url": "https://app.storyblok.com/#/login" }
          ]
        }
      ]
    },
    {
      "id": "g2",
      "title": "KWORQ",
      "links": [
        { "id": "l4", "name": "HOUR LOG", "url": "https://kworq.isdoing.com/" },
        {
          "id": "l5",
          "name": "Listing",
          "type": "list",
          "links": [
            { "name": "Agencyspotter", "url": "https://www.agencyspotter.com/recent_activity/kworq" },
            { "name": "Clutch", "url": "https://clutch.co/provider/my-profile" }
          ]
        },
        { "id": "l6", "name": "Contracts", "url": "https://drive.google.com/drive/folders/1Rzv-yerVbqe0qnOXQvxGlGaAj5HYnOI2" },
        { "id": "l7", "name": "Office Conference Rooms", "url": "https://roulstonhouse.skedda.com/booking" }
      ]
    },
    {
      "id": "g3",
      "title": "Ad Tools",
      "links": [
        { "id": "l8", "name": "Varos", "url": "https://www.varos.com/" },
        { "id": "l9", "name": "Foreplay", "url": "https://app.foreplay.co/library" },
        { "id": "l10", "name": "Facebook ad library", "url": "https://www.facebook.com/ads/library/?active_status=all&ad_type=political_and_issue_ads&country=US&media_type=all" }
      ]
    },
    {
      "id": "g4",
      "title": "AI",
      "links": [
        { "id": "l11", "name": "Chat GPT", "url": "https://chat.openai.com/chat" },
        { "id": "l12", "name": "Promptomania", "url": "https://promptomania.com/midjourney-prompt-builder/" },
        { "id": "l13", "name": "Background Removal", "url": "https://express.adobe.com/tools/remove-background" },
        { "id": "l14", "name": "AI Avatar", "url": "https://studio.d-id.com/editor" },
        { "id": "l15", "name": "Mid Journey Docs", "url": "https://docs.midjourney.com/docs/models" },
        { "id": "l16", "name": "RunBetter", "url": "https://staging.runbetter.xyz/" }
      ]
    },
    {
      "id": "g5",
      "title": "DASHBOARDS",
      "links": [
        { "id": "l17", "name": "Unifi", "url": "https://unifi.ui.com/dashboard" },
        { "id": "l18", "name": "Unifi Direct", "url": "https://10.0.1.1" },
        { "id": "l19", "name": "Protect", "url": "https://10.0.1.1/protect/dashboard" },
        { "id": "l20", "name": "Homebridge", "url": "http://10.0.40.51/login" }
      ]
    },
    {
      "id": "g6",
      "title": "Social",
      "links": [
        { "id": "l21", "name": "Facebook", "url": "https://www.facebook.com" },
        {
          "id": "l22",
          "name": "Twitter",
          "type": "list",
          "links": [
            { "name": "Twitter", "url": "https://twitter.com" },
            { "name": "TweetDeck", "url": "https://tweetdeck.twitter.com" }
          ]
        },
        { "id": "l23", "name": "Google+", "url": "https://plus.google.com" }
      ]
    },
    {
      "id": "g7",
      "title": "Storage",
      "links": [
        { "id": "l24", "name": "Dropbox", "url": "https://www.dropbox.com" },
        { "id": "l25", "name": "Google Drive", "url": "https://drive.google.com" },
        { "id": "l26", "name": "OneDrive", "url": "https://onedrive.live.com" }
      ]
    },
    {
      "id": "g8",
      "title": "Tools",
      "links": [
        { "id": "l27", "name": "Regexr", "url": "https://regexr.com/" },
        { "id": "l28", "name": "Metatags", "url": "https://metatags.io/" }
      ]
    },
    {
      "id": "g9",
      "title": "Managed Platforms",
      "links": [
        { "id": "l29", "name": "Shopify Partners", "url": "https://partners.shopify.com/505425/stores" },
        {
          "id": "l30",
          "name": "Facebook",
          "type": "list",
          "links": [
            { "name": "Business Manager Kworq", "url": "https://business.facebook.com/settings/people/100044525913163?business_id=253340705042661" },
            { "name": "Business Manager Select", "url": "https://business.facebook.com/select/" },
            { "name": "Business Help", "url": "https://www.facebook.com/business/help" },
            { "name": "Facebook Support", "url": "https://www.facebook.com/support" },
            { "name": "Facebook Ad Manager", "url": "https://business.facebook.com/adsmanager" },
            { "name": "Meta Pro Team", "url": "https://www.facebook.com/business/meta-pro-team" },
            { "name": "Facebook Partner", "url": "https://www.facebook.com/fbp" },
            { "name": "Facebook Partner LInk", "url": "https://adsmanager.facebook.com/latest/settings/business_ad_partnerships?nav_ref=ads_manager_bc_upsell&business_id=253340705042661" }
          ]
        },
        {
          "id": "l31",
          "name": "Google",
          "type": "list",
          "links": [
            { "name": "Tag Manager", "url": "https://tagmanager.google.com/" },
            { "name": "Analytics", "url": "https://analytics.google.com/" },
            { "name": "Search Console", "url": "https://search.google.com/search-console" },
            { "name": "ADs", "url": "https://ads.google.com/" },
            { "name": "Data", "url": "https://datastudio.google.com" },
            { "name": "Trends", "url": "https://trends.google.com/trends/?geo=US" },
            { "name": "Event Builder", "url": "https://ga-dev-tools.google/ga4/event-builder/" }
          ]
        },
        {
          "id": "l32",
          "name": "TikTok",
          "type": "list",
          "links": [
            { "name": "TikTok Business", "url": "https://business.tiktok.com/" }
          ]
        }
      ]
    },
    {
      "id": "g10",
      "title": "Chrome",
      "links": [
        { "id": "l33", "name": "Web Store", "url": "https://chrome.google.com/webstore" },
        {
          "id": "l34",
          "name": "Settings",
          "type": "list",
          "links": [
            { "name": "Settings", "url": "chrome://settings" },
            { "name": "Extensions", "url": "chrome://extensions" },
            { "name": "Flags", "url": "chrome://flags" }
          ]
        },
        {
          "id": "l35",
          "name": "Content",
          "type": "list",
          "links": [
            { "name": "Apps", "url": "chrome://apps" },
            { "name": "Bookmarks", "url": "chrome://bookmarks" },
            { "name": "Downloads", "url": "chrome://downloads" },
            { "name": "History", "url": "chrome://history" }
          ]
        }
      ]
    },
    {
      "id": "g11",
      "title": "3D PRINTER",
      "links": [
        { "id": "l36", "name": "Octoprint", "url": "http://10.0.1.231" },
        { "id": "l37", "name": "Calibrate", "url": "https://teachingtechyt.github.io/upgrades.html#bltouch" }
      ]
    },
    {
      "id": "g12",
      "title": "CODE",
      "links": [
        { "id": "l38", "name": "GitHub", "url": "https://github.com/csullivan145" }
      ]
    },
    {
      "id": "g13",
      "title": "YT",
      "links": [
        { "id": "l39", "name": "Deliverables", "url": "https://docs.google.com/spreadsheets/d/1zri-6K6J6_8oVnnPWYdXoGrKBZ0xDe4tNGP42QmJp04/edit#gid=1709686379" },
        { "id": "l40", "name": "FILES", "url": "https://drive.google.com/drive/folders/1sKO29b80AmX_LIu9nutiyUvmYfQ6rfcE" },
        { "id": "l41", "name": "8.4", "url": "https://drive.google.com/drive/folders/1Pk3EVfk7ufYp3PHIzmh3gxs09LlRVPvp" }
      ]
    },
    {
      "id": "g14",
      "title": "DISNEY",
      "links": [
        { "id": "l42", "name": "Magic Hour", "url": "https://disneyworld.disney.go.com/en_CA/guest-services/extended-evening/" },
        { "id": "l43", "name": "Disney GC", "url": "https://www.disneygiftcard.com/mycards/list-of-cards" }
      ]
    },
    {
      "id": "g15",
      "title": "MEDS",
      "links": [
        { "id": "l44", "name": "Quest", "url": "https://myquest.questdiagnostics.com/results" },
        {
          "id": "l45",
          "name": "MyChart",
          "type": "list",
          "links": [
            { "name": "NYU", "url": "https://mychart.nyulmc.org/" },
            { "name": "MountSinai", "url": "https://mychart.mountsinai.org/" }
          ]
        },
        { "id": "l46", "name": "Heath Insurance", "url": "https://dashboard.purenroll.com/member-dashboard" }
      ]
    }
  ]
};
