//課題をDirectMessageに送信する用
//backlogから「課題」を取得し、それをslackに通知する

//初期設定
//1.プロジェクトのIDを取得(プロジェクトのurlをみて、[condition.projectId=XXXX]から取得可能。以下の例だと、94621)
//https://~~~~/find/BOTPF?condition.projectId=94621&condition~~~~~~
//2.通知したい人の名前をnamelist.yamlに記入
//[backlogの表示名:slackのメンバーID]の形式
//e.g)r.sugikawa : UHGTVKRK6
//slackのメンバーIDは,取得したい人のプロフィールを表示=>「slackコール」の右にある、「...」マーク(その他マーク)を確認し取得


//backlogのAPIに必要な情報をset
function setInfoOFBacklog() {
  var backlogApiKey = "ここにbacklogのApiKeyを記載";
  var projectId = "projectId"; //projectId
  var statusId = "3";
  var sort = "priority";
  return [backlogApiKey,projectId,statusId,sort];
}

//backlogから課題を取得するAPIを実行
function execBacklogApi(backlogApiKey,projectId,statusId,sort) {
  var backlogUrl = "https://~~~~~~jp/api/v2/issues?apiKey=" + backlogApiKey;
  var backlogParams = { "projectId[]":projectId, "statusId[]":statusId, "sort":sort};

  var headers = {
    "Content-Type" : "Content-Type: application/x-www-form-urlencoded"
  };

  backlogUrl = backlogUrl + "&" + "projectId[]=" + backlogParams["projectId[]"] + "&" + "statusId[]=" + backlogParams["statusId[]"] + "&" + "sort=" + backlogParams["sort"];

  var options = {
    "method" : "get",
    "headers" : headers
  };

  var backlogResponse = UrlFetchApp.fetch(backlogUrl, options);
  return backlogResponse;
}


//slackのAPIに必要な情報をset
function setInfoOfSlack(backlogResponse) {
  var slackApiKey = "ここにslackのApiKeyを記載";
  var userName = "Backlog課題BOT"; //Botの名前
  var asUser = false;
  var backlogJsonToArrays = JSON.parse(backlogResponse);
  return [slackApiKey,userName,asUser,backlogJsonToArrays];
}


//slackのチャンネルに送信するAPIを実行
function execSlackApi(slackApiKey, userName, asUser, backlogJsonToArrays) {

    var sheet=SpreadsheetApp.getActiveSheet();
    var value=sheet.getRange("A1:B" + sheet.getLastRow()).getValues(); //範囲を指定（A1からB列の最後の行まで）
    var namelist = {};//名前を変換するためのhashを作成

    for (  var i = 0;  i < value.length;  i++  ) {
      namelist[value[i][0]] = value[i][1];
    };

  for (var i = 0; i < backlogJsonToArrays.length; i++ ) {
    var createdDate = backlogJsonToArrays[i]["created"]; //課題を作成した日にち
    var assigneeUserOfBacklog = backlogJsonToArrays[i]["assignee"]["name"]; //担当者

    var assigneeUserOfSlack = namelist[assigneeUserOfBacklog]; //namelistを元にslack用の名前に変換

    var issueKey = backlogJsonToArrays[i]["issueKey"]; //課題のkey(これを元にリンク作成)
    var priority = backlogJsonToArrays[i]["priority"]["name"];
    var notHandledUrl = "https://sonicmoov.backlog.jp/view/" + issueKey;
    var text = "作成日:" + createdDate + "%0A課題URL:" + notHandledUrl + "%0A優先度:" + priority;
    var slackUrl      = "https://slack.com/api/chat.postMessage?token=" + slackApiKey;

    var slackParams = {
      "channel":"@" + assigneeUserOfSlack,
      "text":text,
      "username":userName,
      "as_user":asUser
    };

    slackUrl = slackUrl + "&" + "channel=" + slackParams["channel"] + "&" + "text=" + slackParams["text"] + "&" + "username=" + slackParams["username"] + "&" + "as_user=" + slackParams["as_user"];
    var headers = {
      "Content-Type" : "Content-Type: application/x-www-form-urlencoded"
    };

    var options = {
      "method" : "post",
      "headers" : headers
    };
    UrlFetchApp.fetch(slackUrl, options);
  }
}


function main() {
  var backlogarr = setInfoOFBacklog();
  var backlogResponse = execBacklogApi(backlogarr[0],backlogarr[1],backlogarr[2],backlogarr[3]);
  var slackarr = setInfoOfSlack(backlogResponse);
  execSlackApi(slackarr[0],slackarr[1],slackarr[2],slackarr[3]);

}
