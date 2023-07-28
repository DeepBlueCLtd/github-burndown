const DONE = "Done";
const GITHUB_TOKEN=PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN")
const CONFIG_SHEET_NAME = "CONFIG";
const PER_PAGE = 100;
const HEADERS = ["Request Date", "Done", "Done (Hour)", "Not Done", "Not Done (Hour)"]

function renderResult() {
  let summary = {
    countDone: 0,
    countNotDone: 0,
    sumHoursDone: 0,
    sumHoursNotDone: 0,
  };
  const config = fetchConfig()
  let variables = {
    orgName: config.ORG_NAME,
    projectNumber: config.PROJECT_NUMBER,
    pages: PER_PAGE,
    after: null
  };
  summary = sumProjectHoursByStatus(GITHUB_TOKEN, variables, summary);
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.SHEET_NAME);
  let row = getFirstEmptyRowByColumnArray(sheet);
  row = setAndSkipHeader(config, sheet, row)
  let range = sheet.getRange(row, 1, 1, 5);
  const utcNow = Utilities.formatDate(new Date(), 'Etc/GMT', 'yyyy-MM-dd HH:mm')
  range.setValues([[utcNow, summary.countDone, summary.sumHoursDone, summary.countNotDone, summary.sumHoursNotDone]]);
}

function fetchConfig() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
  const configRange = sheet.getRange(1, 1, 5, 2);
  const configList = configRange.getValues();
  let configMap = {}
  for (const element of configList) {
    configMap[element[0]] = element[1]
  }
  return configMap;
}

function setAndSkipHeader(config, sheet, row) {
  if (row === 1) {
    let columHeader = sheet.getRange(1, 1, 1, 1);
    columHeader.setValues([[config.GRAPH_TITLE]]);
    columHeader = sheet.getRange(2, 1, 1, 5);
    columHeader.setValues([HEADERS]);
    return 3
  }
  if (row === 2) {
    let columHeader = sheet.getRange(2, 1, 1, 5);
    columHeader.setValues([HEADERS]);
    return 3
  }
  return row
}

// From answer https://stackoverflow.com/a/9102463/1677912
function getFirstEmptyRowByColumnArray(spr) {
  let column = spr.getRange('A:A');
  let values = column.getValues();
  let ct = 0;
  while (values[ct] && values[ct][0] != "") {
    ct++;
  }
  return (ct + 1);
}

function summarizeResponse(resp, summary) {
  if (resp.errors) {
    throw new Error(JSON.stringify(resp.errors));
  }
  let nodes = resp.data.organization.projectV2.items.nodes;
  for (const element of nodes) {
    if (element.status?.status === DONE) {
      summary.countDone = summary.countDone + 1;
      summary.sumHoursDone =
        summary.sumHoursDone + parseInt(element.hours?.value ?? 0);
    } else {
      summary.countNotDone = summary.countNotDone + 1;
      summary.sumHoursNotDone =
        summary.sumHoursNotDone + parseInt(element.hours?.value ?? 0);
    }
  }
  return summary;
}

function sumProjectHoursByStatus(github_token, variables, summary) {
  const getStatusAndHoursQuery = `
  query GetStatusAndHours($orgName: String!, $projectNumber: Int!, $after: String, $pages: Int!) {
    organization(login: $orgName){
      projectV2(number: $projectNumber){
        items(first: $pages, after: $after){
          pageInfo{ hasNextPage endCursor }
          nodes{
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
          }
        }
      }
    }
  }
`;

  const response = UrlFetchApp.fetch("https://api.github.com/graphql", {
    method: "POST",
    contentType: 'application/json',
    headers: {
      'User-Agent': 'Github Hours Summarize',
      'Authorization': `Bearer ${github_token}`,
    },
    payload: JSON.stringify({
      query: getStatusAndHoursQuery,
      variables: variables
    }),
  });

  const resp = JSON.parse(response.getContentText());
  // summarize the response right now so to not save too much response in memory
  summary = summarizeResponse(resp, summary)

  const pageInfo = resp.data.organization.projectV2.items.pageInfo;
  if (resp.data && pageInfo.hasNextPage) {
    variables.after = pageInfo.endCursor;
    return sumProjectHoursByStatus(variables, summary);
  }

  return summary;
}
