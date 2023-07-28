# GitHub Burndown Chart Generator

## Objective:
The GitHub Burndown Chart Generator aims to create a burndown chart from GitHub issues using Google Sheets through the power of Apps Script.

## How to Run:

1. Create a new Google Sheets document.
2. Create a sheet named "CONFIG," which will hold the configuration for the script.
    - Only include information in the "CONFIG" sheet that you want people to see. Keep in mind that even if you hide the sheet, users with view access can still duplicate the sheet and potentially access the hidden data.
    - For more information on hiding sheets in Google Sheets, you can refer to this support article: https://support.google.com/docs/answer/1218656?hl=en&co=GENIE.Platform%3DDesktop&oco=0#
3. On the "CONFIG" sheet, place the following table in the top left corner (A1:B4). The order doesn't matter, but all fields are required:
```
PROJECT_NUMBER,3
ORG_NAME,DeepBlueCLtd
GRAPH_TITLE,RCO Burndown Chart
SHEET_NAME,RCO
```
4. Add your GitHub token to the script properties:
    - Follow this guide to obtain your GitHub token: [GitHub - Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#personal-access-tokens-classic). For this script, you only need the `project: read:project` access.
        - This video provide step by step tutorial on generating github token [Youtube]https://www.youtube.com/watch?v=9lGcbQR4k4Y
    - In Apps Script, go to Project Settings -> Edit Script Properties.
    - Add a property named `GITHUB_TOKEN` and set its value as your GitHub token.
5. Create another sheet as your target sheet (RCO by default), which can have any name, as long as it matches the value of the `SHEET_NAME` field from the CONFIG sheet.
6. Set up the Apps Script:
    - Go to Extensions -> Apps Script.
    - Copy the script from `code.js` to `code.gs` in Apps Script.
    - Set it to run the `renderResult` function.
    - Try running the script, and if everything is working correctly, it should display something like this in your target sheet:
```
RCO Burndown Chart,,,,
Request Date,Done,Done (Hour),Not Done,Not Done (Hour)
2023-07-27 10:28,7,24,39,229
```
7. Set up Triggers. Press "Add Triggers."
    - Set the event source to Time-Driven and choose the desired interval.
    - You can choose any trigger that works, as long as the `Choose which function to run` field is set to: `renderResult`.
8. From this Google Sheet, you can generate a burndown chart for your project.
    <!-- TODO: Add this part -->
    1. 
9. Publish the image and add it to your GitHub page.

## How to Fetch a GitHub API Token:

## Process
![Process Diagram](assets/diagram.png)

## Lessons Learned

### GitHub GraphQL API
The GitHub GraphQL API can be quite challenging, especially when fetching custom fields like "Status" and "Hours." It requires some exploration to use effectively.

One issue we encountered was fetching custom fields in GitHub v2 projects using `fieldValueByName(name: $field_name)`. However, this method proved problematic when attempting to fetch multiple custom fields simultaneously.

The solution was to use GraphQL aliases: [Using Aliases in GraphQL](https://blog.logrocket.com/using-aliases-graphql/).

```
hours: fieldValueByName(name: "Hours") {
... on ProjectV2ItemFieldSingleSelectValue {
    value: name
    }
}
status: fieldValueByName(name: "Status") {
    ... on ProjectV2ItemFieldSingleSelectValue {
        status: name
    }
}
```

This approach worked perfectly and also made processing the response easier.

### Google Apps Script

Setting up Apps Script was surprisingly straightforward. Although securing tokens remained challenging since users with edit access could see your GITHUB_TOKEN script properties. If you find a better way to handle this, feel free to message us. To prevent your GitHub token from being leaked, it's recommended to avoid sharing edit access with others.

There are some minor differences compared to regular JavaScript, like using `UrlFetchApp` for API requests. But for simple scripts, your code should mostly work out of the box with Google Apps Script.