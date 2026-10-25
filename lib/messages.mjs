// Stable keys for the new learning interface. Existing bilingual content can migrate gradually.
const messages={
  today:['今日の練習','Today’s practice'],continue:['続きから','Continue'],review:['今日の復習','Review due cases'],practice:['練習する','Practice'],learnNotation:['記号を学ぶ','Learn notation'],learnCFOP:['初心者CFOP','Beginner CFOP'],records:['記録を見る','View records'],
  intro:['見分ける・思い出す・実物で回す。今の目的から始めましょう。','Recognize, recall, or turn your physical cube. Start with your goal.'],
  due:['復習候補 {count} ケース','{count} cases due for review'],emptyDue:['復習期限のケースはありません。好きなケースから始められます。','No cases are due. You can practice any case.'],
  practiceTitle:['ケース練習','Case practice'],case:['ケース','Case'],mode:['練習の段階','Practice stage'],task:['何を練習する？','What to practice?'],learn:['特徴を学ぶ','Learn features'],compare:['似たケースを比べる','Compare similar cases'],mixed:['混ぜて復習','Mixed review'],recognition:['ケースを見分ける','Recognize the case'],recall:['手順を思い出す','Recall the moves'],execution:['実物で回す','Physical execution'],solve:['全体ソルブを計る','Time a full solve'],
  next:['次のケース','Next case'],try:['見分けてみる','Try recognizing'],advance:['このケースを練習する','Practice this case'],hint:['ヒントを見る','Show hint'],answer:['手順を表示','Show algorithm'],submit:['回答する','Check answer'],moves:['回転記号を入力','Enter move notation'],
  correct:['正解です','Correct'],incorrect:['もう一度確認しましょう','Review this case again'],recorded:['今回の結果を保存しました','Result saved'],self:['実物の結果は自己申告です','Physical results are self-reported'],
  startTimer:['計測を始める','Start timer'],stopTimer:['計測を止める','Stop timer'],success:['正確にできた','Completed correctly'],failure:['間違えた・未完了','Mistake / incomplete'],timerHint:['実物のキューブで回し、計測後に結果を記録してください。','Turn your physical cube, stop the timer, then record your result.'],
  noAuto:['3Dの再生は、本人の成功記録には加算されません。','3D playback does not count as your own successful attempt.'],
  emptyHistory:['まだ練習記録はありません。従来の習得チェックは引き継がれています。','No practice attempts yet. Your existing learned checks are preserved.'],
  historyTitle:['練習の記録','Practice records'],attempts:['試行','Attempts'],accuracy:['ヒントなし成功','Success without hints'],delayed:['24時間以上空けた成功','Success after 24h+'],average:['成功時の平均時間','Average successful time'],latest:['最近の記録','Recent attempts'],noTime:['未計測','Not timed'],selfLabel:['自己申告','Self-reported'],autoLabel:['自動判定','Automatically checked'],
  caseRecords:['ケース別の記録','Records by case'],allCases:['全ケース','All cases'],checkedOnly:['自己チェック済み・練習未記録','Manually checked; no attempts recorded'],seenOnly:['閲覧済み・練習未記録','Viewed; no attempts recorded'],
  reviewPolicy:['復習間隔は練習用の目安です。習得を保証する判定ではありません。','Review intervals are starting guidelines, not a certification of mastery.'],
  migration:['従来の習得チェックを引き継ぎました','Existing learned checks were preserved'],storageError:['端末への保存ができません。記録を失わないようバックアップコードを書き出してください。','Could not save on this device. Export a backup to retain your records.'],
  protected:['保存データの形式を読み取れないため、自動上書きを停止しています。元データを書き出して保管してください。','Automatic saving is paused because the stored format is unsupported. Export the original data to keep it safe.'],
  backupMade:['履歴を含むバックアップコードを発行しました','Created a backup including practice history'],backupAdded:['既存の進捗を残して記録を追加しました','Added records while preserving existing progress'],backupBad:['コードが壊れているか、未対応の形式です。現在の進捗は変更していません。','Invalid or unsupported backup. Current progress is unchanged.'],
  backupLabel:['進捗と練習履歴のバックアップ','Back up learned checks and practice history'],backupNote:['旧CFOP:コードも読み込めます。読み込みは現在の記録へ追加し、履歴を消しません。','Legacy CFOP: codes are supported. Import adds to current records without deleting history.'],
  version:['アプリ v{app} · 教材 {catalog}','App v{app} · Catalog {catalog}'],update:['更新版の準備ができました。練習を保存して、このサイトの全タブを閉じて開き直すと切り替わります。','An update is ready. Save your practice, close all site tabs, and reopen to switch versions.'],saveBackup:['バックアップへ','Open backup'],
  sections:['区間練習','Segment practice'],continuous:['連続再生','Continuous'],predictMode:['区切りで予測','Pause to predict'],speed:['再生速度','Playback speed'],repeat:['この区間を反復','Repeat this segment'],repeatOff:['反復を停止','Stop repeating'],segment:['区間 {number} / {count}','Segment {number} / {count}'],predict:['次の区間で動かすピースと、戻すペアを予測してから続けましょう。','Predict which pieces move and which pair returns before continuing.'],nextSegment:['次の区間へ','Play next segment'],
  viewControls:['視点を変える','Change viewpoint'],left:['視点を左へ','Rotate view left'],right:['視点を右へ','Rotate view right'],up:['視点を上へ','Rotate view up'],down:['視点を下へ','Rotate view down'],back:['背面を見る','View back'],
  close:['閉じる','Close'],startNotice:['記号や基本の持ち方から確認できます。','Start with notation and the basic grip.'],
  dueNext:['次回の目安','Suggested next review'],dueNow:['今から','Now'],inputInvalid:['回転記号を確認してください','Check the move notation'],performance:['この端末の応答記録','Responsiveness on this device'],perfNote:['操作から描画までの参考値です。実ユーザーINPとは異なります。','Local action-to-paint samples; not field INP.'],
};
export function text(key,lang='ja',args={}){
  const pair=messages[key];if(!pair)throw new Error('Unknown message '+key);
  return pair[lang==='en'?1:0].replace(/\{(\w+)\}/g,(_,name)=>String(args[name]??''));
}
export {messages};
