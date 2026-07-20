/* ================= Japanese / English UI ================= */
let LANG='ja';
try{LANG=localStorage.getItem('cfop-lang')||'ja';}catch(e){}
const SYSTEM_THEME_QUERY=typeof window.matchMedia==='function'?window.matchMedia('(prefers-color-scheme: light)'):null;
let THEME_FOLLOWS_SYSTEM=true;
let THEME=SYSTEM_THEME_QUERY&&SYSTEM_THEME_QUERY.matches?'light':'dark';
try{
  const savedTheme=localStorage.getItem('cfop-theme');
  if(savedTheme==='light'||savedTheme==='dark'){THEME=savedTheme;THEME_FOLLOWS_SYSTEM=false;}
}catch(e){}
const EN={
  'CFOP トレーナー':'CFOP Trainer','習得マップ':'Learning Map','簡易':'Simple','本格':'Advanced','習得':'Learned',
  'Cross → F2L → OLL → PLL の順に完成させる。まず簡易で1周、その後本格へ。':'Complete Cross → F2L → OLL → PLL in order. Finish one pass in Simple mode, then move to Advanced.',
  '覚える手順(アルゴリズム)の数':'Algorithms to Learn','デイジー法':'Daisy method','直接・8手以内':'Direct · within 8 moves','基本形+応用':'Basics + applications','全ケース':'All cases','合計':'Total',
  '※暗記するアルゴリズムの本数。カード内の「◯手」は1手順あたりの回転数(手数)。':'Number of algorithms to memorize. “moves” on each card means turns per algorithm.',
  '進捗の保存・復元(コード方式)':'Save / Restore Progress (code)','ここに進捗コードが表示されます':'Your progress code appears here','コード発行':'Generate Code','コピー':'Copy','復元':'Restore',
  '進捗はこの端末に自動保存されます。別端末への移行・バックアップにはコードを使用してください。':'Progress is saved automatically on this device. Use a code to back it up or transfer it to another device.',
  '基礎':'Basics','回転記号とトリガー。すべての手順はこの部品でできている。':'Turn notation and triggers. Every algorithm is built from these pieces.',
  '回転記号':'Turn Notation','図をタップ=3Dでその回転が動く。濃い部分が動く層':'Tap a symbol to animate it. Only the moving layer is highlighted.','外側から見た向き':'Direction viewed from outside',
  'もう一度再生':'Replay','視点リセット':'Reset View','↺ 視点':'↺ View','↻ 視点':'↻ View',
  '左面':'Left','上面':'Top','右面':'Right','前面':'Front',
  '目次':'Contents','⤒ ページ先頭':'⤒ Top of page',
  '指使いの基本':'Finger tricks','大きく持ち替えず、指と手首は最小限に':'Minimal regrips, minimal motion',
  '回転':'Move','指':'Finger','コツ':'Tip',
  '右人差し指':'Right index','左人差し指':'Left index','右人差し指→中指':'Right index → middle','右手首':'Right wrist','左手首':'Left wrist','右親指':'Right thumb','薬指':'Ring finger','M系':'M slices',
  '引き金を引くように手前へ弾く(トリガー)。他の指はU面に触れない':'Flick toward you like pulling a trigger. Keep other fingers off the U face',
  'Uの鏡映。基本練習では人差し指を優先(親指プッシュに頼りすぎない)':"Mirror of U. Prefer the index finger while learning; don't lean on thumb pushes",
  '2本連続で弾く「ダブルトリガー」。慣れるときっちり180°回る':'"Double trigger" — index then middle. With practice it lands exactly 180°',
  'ホームグリップのまま手首を返す。持ち替えないのが重要(直後のR\'に備える)':"Rotate the wrist from home grip. No regrip — the next R' is usually coming",
  'Rの鏡映。親指で挟んで回してよいのはL・Rだけ':'Mirror of R. Thumb-pinch turning is fine only for L and R',
  'キューブをやや縦に持ち、上から弾き下ろす':'Tilt the cube slightly and flick down from the top',
  '下から弾き上げる。左小指をD面に当てるとキューブがぶれない':'Flick up from below. Rest the left pinky on D to keep the cube steady',
  '裏から薬指で弾く。クロスで多用するので早めに慣れる':'Flick from underneath with the ring finger. Used constantly in cross',
  '左右をしっかり両手で押さえ、薬指で中層を弾く':'Hold both sides firmly and flick the middle layer with a ring finger',
  'スピードキューブの持ち方の基本は「ホームグリップ」——両親指を前面(F)に、中指・薬指を背面(B)に添える構えから始まる。ここから指1本の最小の動きで各面を回すのが指使い(フィンガートリック)。悪い癖は後から直すのが大変なので、最初に正しい型を覚えるのが最短ルート。':'The base of speedcubing is the "home grip" — thumbs on the front (F), middle and ring fingers on the back (B). Finger tricks turn each face with one finger and minimal motion. Bad habits are hard to unlearn, so start with the correct form.',
  '避けたい癖:':'Habits to avoid:',
  'U系を親指で挟んで回す':'thumb-pinching U turns','回す際に手がキューブから離れる':'letting the hand leave the cube','親指プッシュの多用':'overusing thumb pushes',
  '。共通する問題は「手の動きが大きい/ホールドが浮く」ことで、上達するほど壁になりやすい。正しい指使いの感覚は、何もない所で指を自然に曲げる動き——その動きだけで回すこと。指に無理な力がかかる回し方は見直しのサイン。':". The common problem is large hand motion and a floating hold — it increasingly becomes a wall as you improve. The right feel: curl your finger naturally in the air, and turn with exactly that motion. A turn that strains the finger is a sign to rework it.",
  'クロスの定石':'Cross principles','短く、かつ回しやすく':'Short and smooth',
  'クロスのパターン数はOLL/PLLと比べ物にならないほど多く、全暗記は不可能。代わりに「定石」を頭に入れる。鍵は':'Cross has far more patterns than OLL/PLL — memorizing them all is impossible. Learn principles instead. The key is that ',
  '手順が短く、かつ回しやすいこと':'solutions must be short AND smooth to turn',
  '——効率の良い手順ならほとんどの場合':' — an efficient solution almost always finishes within ',
  '7手以内':'7 moves',
  '(センター合わせのD/D\'込みで8手以内)で揃う。少し手数が増えても、引っかからず回せる手順の方が結果的に速い。':" (8 including the final D/D' center alignment). A slightly longer solution that flows beats a shorter one that catches.",
  '① エッジ優先、センターは最後':'1. Edges first, centers last',
  '最初からセンターに合わせようとすると手数が伸びる。エッジ4枚の相対位置を先に作り、最後にD/D\'でセンターへ一致させる方が短くスムーズ':"Matching centers from the start makes solutions longer. Build the four edges' relative positions first, then align with D/D' at the end",
  '② 側面色を見た瞬間に行き先を決める':'2. Decide the destination from the side color',
  '基礎編の「センターの色の並び」が入っていれば、白エッジの側面色から目的地は即決できる。迷い時間ゼロがクロスの速さ':"With the center layout memorized, a white edge's side color tells you its destination instantly. Zero hesitation is cross speed",
  '③ 1枚2手以内を目安に':'3. Aim for ≤2 moves per edge',
  '単独の白エッジなら2手以内で定位置に運べるのが目安。3手以上かかっていたら、より短い経路を探す癖をつける':'A lone white edge should reach home within about 2 moves. If you take 3+, train yourself to look for a shorter path',
  '④ インスペクションで完成形まで読む':'4. Plan the full cross in inspection',
  '実際に回す前に頭の中でクロス完成まで手順を決める。15秒に収まらなくても、練習では時間無制限でじっくり考えてよい——脳内で回す負荷こそが練習':"Decide the whole cross mentally before turning. In practice, take unlimited time — the mental load of turning the cube in your head IS the training",
  '仕上げの練習法: 手順を決めたら':'Finishing drill: once the plan is set,',
  'キューブを見ずに(または目隠しで)クロスだけ揃える':'solve the cross without looking (or blindfolded)',
  '。見ないで揃えられる=完全に読めている証拠。フリープレイのWCAスクランブルを使えば何度でも試せる。':". If you can do it blind, you truly read it. Use free play's WCA scramble to drill endlessly.",

  'センターの色の並び(対面ペア/側面は時計回りに 青→赤→緑→橙)は基礎編「センターの位置関係」を参照。ここでの前提知識になる。':'For the fixed center layout (opposite pairs / clockwise side order blue→red→green→orange), see "Center Geography" in Basic — it is the prerequisite here.',
  '↑↓ 選択':'↑↓ Select','Enter 移動':'Enter Go','Esc 閉じる':'Esc Close','Shift+←→ ページ':'Shift+←→ Pages',
  'ボタン操作へ':'Button controls','スワイプ操作へ':'Swipe controls','ドラッグで視点を回せる(D・B・Lの確認用)':'Drag to rotate the view (useful for D, B and L).',
  '3D 手順プレイヤー':'3D Algorithm Player','名前つき手順を選ぶ':'Choose a named algorithm','再生する手順を選択':'Choose an algorithm to play','再生する回転記号':'Turn notation to play',
  '最初に戻る':'Go to Start','1手戻る':'Back One Move','再生':'Play','一時停止':'Pause','1手進む':'Forward One Move','最後へ進む':'Go to End','手順の再生位置。左へ戻すと逆方向に確認できます':'Algorithm position. Drag left to review in reverse.',
  'スライダーを左右へ動かすと、途中状態・逆戻しを自由に確認できます':'Drag the slider in either direction to inspect any intermediate state.','′(逆回転)':'′ (counterclockwise)',
  '基本回転':'Basic Turns','2層回し':'Wide Turns','小文字 = w(ワイド)':'Lowercase = w (wide)','中層':'Slice Moves','持ち替え':'Cube Rotations','全体回転。手数に数えない':'Whole-cube rotation; not counted as a move.',
  '展開図':'Cube Net','記号を選ぶと動く層がアクセント表示で連動':'The moving layer is softly highlighted when you choose a turn.','本サイトの基準配色:上=黄・前=青・右=赤。対面は 白⇔黄 / 青⇔緑 / 赤⇔橙':'Site color scheme: top=yellow, front=blue, right=red. Opposites: white/yellow, blue/green, red/orange.',
  '名前で覚える手順':'Named Algorithms','OLL・PLLに何度も出てくる部品':'Building blocks repeated throughout OLL and PLL','トリガー':'Triggers','手が覚えるべき最小単位':'Smallest units to build into muscle memory',
  'OLL・PLLの手順は暗記ではなく「トリガーの連結」として読む。例: T字OLL = セクシー1回 + スレッジ1回。':'Read OLL and PLL as linked triggers, not one long string. Example: T OLL = one Sexy Move + one Sledgehammer.',
  '最重要:「ゆっくり回して速くなる」。':'Most important: slow down to speed up.',
  '1回転に1〜2秒かけるほど遅く、止まらずにF2Lを通す練習をする。速く回すと今の手だけを見てしまうが、ゆっくりなら次のペアを探す余裕が生まれる。この「先読み(ルックアヘッド)」が20秒の壁を破る鍵で、初中級者のタイムの大半はF2Lの':'Practise F2L at 1-2 seconds per turn without stopping. Turning fast forces you to watch only the current move; going slowly leaves room to hunt for the next pair. This lookahead is the key to breaking the 20-second barrier, and most of a beginner\'s time is spent on F2L ',
  '停止時間':'pauses',
  '——手順の知識不足ではない。':' — not on a lack of algorithm knowledge.',
  'Cross / F2L / LL を分けて計測。一番遅い段階から直す。例: 18秒の内訳はCross約2秒・F2L約10秒・LL約6秒':'Time Cross / F2L / LL separately and fix the slowest first. A typical 18-second solve splits into roughly 2s cross, 10s F2L, 6s last layer.',
  '※目安: 1:10〜1:20(初級) → F2Lを覚えて1分切り → 2-Look OLL/PLL習得 → 先読み強化でsub-30 → sub-20。数か月単位で伸びるので焦らないこと。':'Rough path: 1:10-1:20 as a beginner, then under a minute once F2L clicks, then 2-Look OLL/PLL, then sub-30 with better lookahead, then sub-20. Progress takes months, so be patient.',
  '上達のコツ':'How to Improve','速さは「回転の速さ」より「止まらないこと」':'Speed comes from not pausing, not from turning fast.',
  'クロスは必ず底面(D)で':'Build the cross on the bottom (D)','上で作って持ち替えると1〜2秒の損。最初から底で作れば、F2Lのペアが上に見えている':'Building it on top then flipping costs 1-2 seconds. Build it on the bottom and your F2L pairs are already in view on top.',
  'クロスは8手以内':'Cross in 8 moves or fewer','どんな配置でも必ず8手以内で解ける。まず8手、慣れたら6〜7手を狙う':'Any cross can be solved in 8 moves or fewer. Aim for 8 first, then 6-7 with practice.',
  '15秒の観察を使い切る':'Use all 15 seconds of inspection','大会では15秒の観察時間がある。4つのエッジを探す→手順を組む→頭で予行。慣れると目を閉じてもクロスが回せる':'Competitions give 15 seconds of inspection. Find the 4 edges, plan the moves, rehearse mentally. With practice you can execute the cross with your eyes closed.',
  'エッジは相対で置く':'Place edges relative to each other','1本ずつ完璧に合わせるのは無駄。4本の並び順だけ合わせ、センターとの整列は最後にまとめてD回しで':'Placing each edge perfectly one at a time is wasteful. Get the order right, then align to the centres at the end with D turns.',
  '持ち替え(x/y)を減らす':'Cut down cube rotations (x/y)','回転は時間を食い、先読みを壊す。R/L/F/B/Dを使えば持ち替えずに全スロットへ入る':'Rotations cost time and wreck lookahead. R/L/F/B/D reach every slot without rotating the cube.',
  'B面は使わない':'Avoid B moves','良い手順にB回しはほぼ出てこない。見えない面を回すと手も目も止まる':'Good algorithms almost never use B. Turning a face you cannot see stalls both hands and eyes.',
  'コーナーから探す':'Spot the corner first','F2Lの次のペアは先にコーナーを見つける。コーナーは2面で判別でき、持ち替えずに見つけやすい':'Find the corner before the edge. A corner is identifiable from two stickers, so it is easier to spot without rotating.',
  '段階別にタイムを取る':'Time each stage separately','段階別にタイムを取る。一番遅い段階から直す':'Time each stage and fix the slowest one first.',
  '1手順4秒以内に':'Drill each algorithm under 4 seconds','OLL/PLLは個別に反復して各4秒以内へ。手が覚えれば目を手順から解放できる':'Drill OLL/PLL individually to under 4 seconds each. Once your hands know them, your eyes are free to look ahead.',
  'カラーニュートラル':'Colour neutrality','上級編。6色どれでもクロスを作れると平均2〜3手得。まず白+黄の2色から始める':'Advanced. Being able to start from any of the 6 colours saves 2-3 moves on average. Start with white and yellow.',
  '持ち方':'Finger Tricks','U面 → 人差し指':'U face → index finger',"U / U' は右手・左手の人差し指ではじく":"Flick U / U' with either index finger.",'R面 → 右手首':'R face → right wrist',"R / R' は手首の返しで。握り直さない":"Turn R / R' with the wrist without regripping.",'視線は次のケース':'Look ahead to the next case','回している面ではなく次に見る場所を見る':'Look where the next case will appear, not at the face you are turning.',
  '① デイジー(上面)':'① Daisy (top)','② 完成形(底面)':'② Finished cross (bottom)','黄色センターの周り':'around the yellow center','側面色':'side color','180°':'180°','練習目標':'Practice Goals',
  '白エッジ4枚を':'Collect all four white edges ','に集める(デイジー)。順序自由・手順なし':' (the daisy). Any order; no algorithm needed.','花びら1枚の':'Match each petal’s ','を同色センターに合わせる':'with its center.','その面を':'Turn that face ','(F2)回して白面へ落とす。残り3枚も同様':' (F2) to move it to the white face. Repeat for the other three.',
  '白面を':'Build it directly with the white face ','下にしたまま':'on the bottom','直接作る。デイジーを経由しない':'; do not use the daisy.','常に':'Always stay within ','8手以内':'8 moves','。エッジ2枚を同時に運ぶ手を優先する':'. Prefer moves that position two edges together.','色ではなく':'Read ','センターとの相対位置':'positions relative to the centers','で見る(持ち替えない)':', not colors (no regrips).','インスペクション15秒で':'During the 15-second inspection, ','全手順を確定':'plan the entire solution','させてから回す':' before turning.',
  'クロスに手順表は存在しない。ただしエッジ1枚の入れ方は下の4パターンしかなく、クロス全体はこの組合せ。位置別の最短手を体に入れる。':'There is no fixed Cross algorithm sheet. Each edge has only the four insertion patterns below; a full Cross combines them. Drill the shortest solution from each position.',
  'エッジ挿入の4パターン':'Four Edge-Insertion Patterns','白×青エッジを前(F)に入れる例。灰色は無視':'Example: insert the white-blue edge at F. Ignore gray pieces.',
  '練習':'Practice','ケースを見て手順を即答する。判定は自分の手で。':'See the case and recall the algorithm instantly. Judge the result yourself.','手順を表示':'Show Algorithm','次のケース':'Next Case','この手順は?':'Which algorithm?','出題範囲を選択':'Select quiz categories',
  'ページナビゲーション':'Page navigation','目次を開閉':'Toggle table of contents','学習モード':'Learning mode','表示テーマ':'Display theme','ライトモード':'Light mode','ダークモード':'Dark mode','日本語':'Japanese','入力した手順':'Custom algorithm','スクランブル':'Scramble','ランダム生成':'Random','クリア':'Clear','▶ 3Dで再現':'▶ Reproduce in 3D','認識できない記号':'Unrecognized tokens','開始状態':'Start state','WCAスクランブル':'WCA Scramble','M/E/S・2層の回転量':'M/E/S & wide amount','もう完成しています。スクランブルしてから試してください':'Already solved — scramble first','センターの位置関係':'Center Geography','色の並びは絶対に変わらない':'The color layout never changes','対面ペア':'Opposite pairs','白⇄黄・青⇄緑・赤⇄橙。対面のペアは固定で、片方が見えればもう片方が確定する':'White⇄yellow, blue⇄green, red⇄orange. Pairs are fixed — seeing one determines the other','側面は時計回りに 青→赤→緑→橙':'Sides run clockwise: blue → red → green → orange','黄を上にして上から見た並び。「青の右隣は必ず赤」——エッジの側面色を合わせるとき、隣のセンター色を見ずに即答できる':'Viewed from above with yellow up. "Red is always right of blue" — so you can name any neighbor without looking','クロスを速くする鍵はこの暗記。白エッジの側面色を見た瞬間「その色のセンターはどっち周りにあるか」が分かれば、D面を回すだけで正しい位置に合わせられる。':'This memorization is the key to a fast cross: the instant you see a white edge\'s side color, you know which way its center lies, and a D turn lines it up.','前(F)':'F','右':'R','奥':'B','左':'L','リセット':'Reset','回転量':'Amount','′ 逆':'′ CCW','▶ ソルブ':'▶ Solve','フリープレイ':'Free Play','自由に回して遊ぶ。ドラッグで視点回転':'Turn freely. Drag to rotate the view','↩ 戻す':'↩ Undo','展開図':'Net','✨ 完成!':'✨ Solved!','持ち方: ':'Grip: ','黄を上・青を正面':'yellow on top, blue in front','にして回し始める(下の展開図・3Dと同じ向き)':' before turning (same orientation as the net and 3D below)','持ち方: ':'Grip: ','黄センターを上・':'yellow center up, ','青センターを正面にして回し始める(3D再現・展開図と同じ基準)。大会(WCA)では白上・緑前が公式。':'blue center facing you (same reference as the 3D player and the net). Official WCA scrambles use white top / green front.','B面':'B face','R面':'R face','L面':'L face','F面':'F face','F面 / R面':'F / R faces','F面 / B面':'F / B faces','F面 / L面':'F / L faces','F面 / R面 / B面':'F / R / B faces','F面 / R面 / L面':'F / R / L faces','F面 / R面 / B面 / L面':'F / R / B / L faces','原則: 記号だけなら「その面を正面から見て」時計回りに90°':'Rule: a bare letter means 90° clockwise as seen facing that side','′(プライム)は反時計回り、2は180°。ポイントは':'Prime (′) is counterclockwise, 2 is 180°. The key is ','その面から見て':'as seen from that face','——例えばBは':' — e.g. B is clockwise seen ','背面から':'from the back','見て時計回りなので、正面から見ると左回りに見える。Dも':', so from the front it looks counterclockwise. D too is clockwise ','下から':'from below','見て時計回りだから、正面からは右へ動いて見える。下のカードの矢印はすべて正面(この画面)から見た向き。':', so from the front it moves right. All arrows below are drawn from this front view.','キューブの構造':'Cube Anatomy','「色」ではなく「ピース」を運ぶゲーム':'A game of moving pieces, not colors','センター ×6':'Centers ×6','エッジ ×12':'Edges ×12','コーナー ×8':'Corners ×8','軸に固定され動かない。面の色はセンターが決める':'Fixed to the core. Each face color is defined by its center','ステッカー2枚。辺の位置だけを移動する':'Two stickers. Moves only between edge positions','ステッカー3枚。角の位置だけを移動する':'Three stickers. Moves only between corner positions','ステッカーは貼り替わらない——動くのは26個のピース。エッジはエッジの場所へ、コーナーはコーナーの場所へしか移動できない。センターは互いの位置関係が固定なので、白の対面は必ず黄、青の右隣は必ず赤(持ち方基準)。だから「面の色を揃える」のではなく「各ピースをセンターに合う場所へ運ぶ」と考える。':'Stickers never peel off — 26 pieces move. Edges only travel to edge spots, corners to corner spots. Centers never move relative to each other: white is always opposite yellow, red always right of blue (standard grip). So think of it as moving each piece to the spot matching the centers, not painting faces.','パーフェクト':'Perfect','パーフェクトスクランブル: 全面で同色ステッカーが縦横斜めに一切隣接しない唯一の配置(43京通り中48対称のみ)':'Perfect Scramble: the unique arrangement where no same-color stickers touch (even diagonally) on any face — only 48 symmetric variants out of 43 quintillion','フォーカス':'Focus','全色':'All colors',
'判別: まずヘッドライト(同色の角2つ)':'Identify: first look for headlights (two same-color corners)',
'判別: 4側面のうちヘッドライトは何組?':'Identify: how many headlight pairs among the 4 sides?',
'あり':'Yes','なし':'None','角完成後':'After corners','4組(全面)':'4 (all sides)','1組':'1 pair','0組':'0 pairs',
'Tパーム':'T perm','Yパーム':'Y perm','エッジ4種':'4 edge cases','エッジのみ残り':'Edges only','隣接系 or 3点系':'Adjacent or 3-cycle','対角系':'Diagonal',
'ヘッドライトを左に向けて T':'Put headlights on the left, then T',
'対角交換。向きはどこでも Y':'Diagonal swap. Any angle works — Y',
'3点=Ua/Ub(回す向きで判別)・対面=H・隣接=Z':'3-cycle = Ua/Ub (by direction) / opposite = H / adjacent = Z',
'角は完成。矢印のないエッジ交換: Ua/Ub/H/Z':'Corners solved. Edge-only swaps: Ua/Ub/H/Z',
'ブロックの有無で細分: T/F/J/R(隣接交換)・G(角も辺も3点)':'Refine by blocks: T/F/J/R (adjacent swap), G (both 3-cycles)',
'角が対角に入れ替わっている: V/Y/N/E':'Corners swapped diagonally: V/Y/N/E',
'デイジーに集める段取りを決める':'Plan how to gather the daisy',
'クロスを最後まで計画し切る。余裕があれば最初のF2Lペアの行き先まで見る':'Plan the full cross. If possible, track the first F2L pair too',
'持ち替えずに回し始められる状態':'Ready to start turning without regripping',
'黄面の周りにデイジー → 花びらの側面色をセンターに合わせて180°ずつ落とす':'Build the daisy around yellow, match each petal side color, drop with 180°',
'白面を下にしたまま8手以内で直接。エッジ2枚を同時に運ぶ手を優先':'Build directly with white down, within 8 moves. Prefer moves placing two edges',
'底面に白十字+側面色がセンターと一致':'White cross on the bottom, side colors matching centers',
'基本4形に持ち込む。両方U面なら白の向きを見て「分離」か「直結」かを判断':'Reduce to the 4 basic forms. If both are on top, check white sticker: split or join',
'ケースを見た瞬間に41分類から即断。スロット内にあるなら引き出しから':'Recognize among 41 cases instantly. If trapped in a slot, extract first',
'下2段(クロス+4スロット)が完成':'Bottom two layers (cross + 4 slots) complete',
'十字ができているか? → なければエッジ手順(点/L字/一文字) → できていればコーナー7種から選ぶ':'Is there a yellow cross? If not: edge algs (dot/L/line). If yes: pick from 7 corner cases',
'形グループ(点・稲妻・魚・L字・十字…)で分類 → 57ケースを即断':'Classify by shape group (dot, lightning, fish, L, cross…) → 57 cases instantly',
'上面が全部黄色(側面はまだズレていてよい)':'Top face fully yellow (sides may still be off)',
'2段階: まずコーナー位置(ヘッドライトあり=T / なし=Y) → 次にエッジ位置(Ua/Ub/H/Z)':'Two steps: corners first (headlights = T / none = Y), then edges (Ua/Ub/H/Z)',
'ヘッドライトの組数で分岐: 4組=エッジのみ / 1組=隣接系 / 0組=対角系 / 角も辺も3点=G系':'Branch by headlight count: 4 = edges only / 1 = adjacent / 0 = diagonal / both 3-cycles = G',
'AUF(上面調整)して全面一致 = 完成':'AUF (adjust U face) and everything matches = solved',
'スクランブルはWCA準拠のrandom-state方式(cubejsによる二相法ソルバ)。環境が対応しない場合はランダムムーブ式に自動フォールバック。':'Scrambles are WCA-style random-state (two-phase solver via cubejs). Falls back to random moves if unsupported.','設定':'Settings','テーマ':'Theme','言語':'Language','ダーク':'Dark','ライト':'Light','日本語':'JA','WCAスクランブル':'WCA Scramble','準備中…':'Preparing…','FR(右)':'FR (right)','FL(左・ミラー)':'FL (left/mirror)','鏡像手順。図は左スロット視点':'Mirrored algs. Diagrams from the left-slot view','標準の右前スロット':'Standard front-right slot','ソルブフロー':'Solve Flow','どこを見て、何で判断するか。タップで展開(簡易/本格で判断基準が変わる)':'What to look at and how to decide. Tap to expand (criteria follow Basic/Full mode)','見る':'LOOK','判断':'DECIDE','完了':'DONE','ページへ':'Open page','インスペクション':'Inspection','習得マップ':'Learning Map',
'開始前の15秒。白エッジ4枚の位置':'The 15s before starting. Locate the 4 white edges','白エッジと側面の色':'White edges and their side colors','白コーナーと相方エッジの位置関係':'The white corner and its partner edge','上面の黄色パターン(側面は見ない)':'Yellow pattern on top (ignore the sides)','側面上段の色配置(ヘッドライト)':'Top-row side colors (headlights)','向きランダム':'Random AUF','※向きランダム中:U調整(AUF)してから実行':'Random AUF on: adjust U (AUF) before executing','アンチスーン':'Anti-Sune','スーン':'Sune','逆セクシー':'Inv-Sexy','セクシー':'Sexy','スレッジ':'Sledge','ヘッジ':'Hedge','最小化':'Minimize','閉じる':'Close','3D再生':'3D Player','3Dプレイヤーを再展開':'Expand 3D player','ケースから解く':'Solve from case','完成から適用':'Apply from solved','入力すると展開図が即時更新。3Dで忠実に再現':'Net updates live. Reproduce faithfully in 3D','スクランブルを入力(例: R U F2 D\' ...)':'Enter a scramble (e.g. R U F2 D\' ...)','手順':'Algorithm','3Dで再生':'Play in 3D','スクランブル':'Scramble','ランダム生成':'Random','クリア':'Clear','▶ 3Dで再現':'▶ Reproduce in 3D','認識できない記号':'Unrecognized tokens','開始状態':'Start state','WCAスクランブル':'WCA Scramble','M/E/S・2層の回転量':'M/E/S & wide amount','もう完成しています。スクランブルしてから試してください':'Already solved — scramble first','センターの位置関係':'Center Geography','色の並びは絶対に変わらない':'The color layout never changes','対面ペア':'Opposite pairs','白⇄黄・青⇄緑・赤⇄橙。対面のペアは固定で、片方が見えればもう片方が確定する':'White⇄yellow, blue⇄green, red⇄orange. Pairs are fixed — seeing one determines the other','側面は時計回りに 青→赤→緑→橙':'Sides run clockwise: blue → red → green → orange','黄を上にして上から見た並び。「青の右隣は必ず赤」——エッジの側面色を合わせるとき、隣のセンター色を見ずに即答できる':'Viewed from above with yellow up. "Red is always right of blue" — so you can name any neighbor without looking','クロスを速くする鍵はこの暗記。白エッジの側面色を見た瞬間「その色のセンターはどっち周りにあるか」が分かれば、D面を回すだけで正しい位置に合わせられる。':'This memorization is the key to a fast cross: the instant you see a white edge\'s side color, you know which way its center lies, and a D turn lines it up.','前(F)':'F','右':'R','奥':'B','左':'L','リセット':'Reset','回転量':'Amount','′ 逆':'′ CCW','▶ ソルブ':'▶ Solve','フリープレイ':'Free Play','自由に回して遊ぶ。ドラッグで視点回転':'Turn freely. Drag to rotate the view','↩ 戻す':'↩ Undo','展開図':'Net','✨ 完成!':'✨ Solved!','持ち方: ':'Grip: ','黄を上・青を正面':'yellow on top, blue in front','にして回し始める(下の展開図・3Dと同じ向き)':' before turning (same orientation as the net and 3D below)','持ち方: ':'Grip: ','黄センターを上・':'yellow center up, ','青センターを正面にして回し始める(3D再現・展開図と同じ基準)。大会(WCA)では白上・緑前が公式。':'blue center facing you (same reference as the 3D player and the net). Official WCA scrambles use white top / green front.','B面':'B face','R面':'R face','L面':'L face','F面':'F face','F面 / R面':'F / R faces','F面 / B面':'F / B faces','F面 / L面':'F / L faces','F面 / R面 / B面':'F / R / B faces','F面 / R面 / L面':'F / R / L faces','F面 / R面 / B面 / L面':'F / R / B / L faces','原則: 記号だけなら「その面を正面から見て」時計回りに90°':'Rule: a bare letter means 90° clockwise as seen facing that side','′(プライム)は反時計回り、2は180°。ポイントは':'Prime (′) is counterclockwise, 2 is 180°. The key is ','その面から見て':'as seen from that face','——例えばBは':' — e.g. B is clockwise seen ','背面から':'from the back','見て時計回りなので、正面から見ると左回りに見える。Dも':', so from the front it looks counterclockwise. D too is clockwise ','下から':'from below','見て時計回りだから、正面からは右へ動いて見える。下のカードの矢印はすべて正面(この画面)から見た向き。':', so from the front it moves right. All arrows below are drawn from this front view.','キューブの構造':'Cube Anatomy','「色」ではなく「ピース」を運ぶゲーム':'A game of moving pieces, not colors','センター ×6':'Centers ×6','エッジ ×12':'Edges ×12','コーナー ×8':'Corners ×8','軸に固定され動かない。面の色はセンターが決める':'Fixed to the core. Each face color is defined by its center','ステッカー2枚。辺の位置だけを移動する':'Two stickers. Moves only between edge positions','ステッカー3枚。角の位置だけを移動する':'Three stickers. Moves only between corner positions','ステッカーは貼り替わらない——動くのは26個のピース。エッジはエッジの場所へ、コーナーはコーナーの場所へしか移動できない。センターは互いの位置関係が固定なので、白の対面は必ず黄、青の右隣は必ず赤(持ち方基準)。だから「面の色を揃える」のではなく「各ピースをセンターに合う場所へ運ぶ」と考える。':'Stickers never peel off — 26 pieces move. Edges only travel to edge spots, corners to corner spots. Centers never move relative to each other: white is always opposite yellow, red always right of blue (standard grip). So think of it as moving each piece to the spot matching the centers, not painting faces.','パーフェクト':'Perfect','パーフェクトスクランブル: 全面で同色ステッカーが縦横斜めに一切隣接しない唯一の配置(43京通り中48対称のみ)':'Perfect Scramble: the unique arrangement where no same-color stickers touch (even diagonally) on any face — only 48 symmetric variants out of 43 quintillion','フォーカス':'Focus','全色':'All colors','設定':'Settings','テーマ':'Theme','言語':'Language','ダーク':'Dark','ライト':'Light','日本語':'JA','WCAスクランブル':'WCA Scramble','準備中…':'Preparing…','FR(右)':'FR (right)','FL(左・ミラー)':'FL (left/mirror)','鏡像手順。図は左スロット視点':'Mirrored algs. Diagrams from the left-slot view','標準の右前スロット':'Standard front-right slot','ソルブフロー':'Solve Flow','どこを見て、何で判断するか。タップで展開(簡易/本格で判断基準が変わる)':'What to look at and how to decide. Tap to expand (criteria follow Basic/Full mode)','見る':'LOOK','判断':'DECIDE','完了':'DONE','ページへ':'Open page','インスペクション':'Inspection','習得マップ':'Learning Map',
'開始前の15秒。白エッジ4枚の位置':'The 15s before starting. Locate the 4 white edges','白エッジと側面の色':'White edges and their side colors','白コーナーと相方エッジの位置関係':'The white corner and its partner edge','上面の黄色パターン(側面は見ない)':'Yellow pattern on top (ignore the sides)','側面上段の色配置(ヘッドライト)':'Top-row side colors (headlights)','向きランダム':'Random AUF','※向きランダム中:U調整(AUF)してから実行':'Random AUF on: adjust U (AUF) before executing','アンチスーン':'Anti-Sune','スーン':'Sune','逆セクシー':'Inv-Sexy','セクシー':'Sexy','スレッジ':'Sledge','ヘッジ':'Hedge','最小化':'Minimize','閉じる':'Close','3D再生':'3D Player','3Dプレイヤーを再展開':'Expand 3D player','ケースから解く':'Solve from case','完成から適用':'Apply from solved','入力すると展開図が即時更新。3Dで忠実に再現':'Net updates live. Reproduce faithfully in 3D',
  'スーン':'Sune','アンチスーン':'Anti-Sune','セクシー':'Sexy Move','逆セクシー':'Inverse Sexy','スレッジ':'Sledgehammer','ヘッジ':'Hedge Slammer','セクシームーブ':'Sexy Move','スレッジハンマー':'Sledgehammer','ヘッジスラマー':'Hedge Slammer',
  'Uパーム(Ua)':'U Perm (Ua)','Uパーム(Ub)':'U Perm (Ub)','Tパーム':'T Perm','Yパーム':'Y Perm',
  '十字(角のみ)':'Cross (corners only)','エッジのみ':'Edges only','T字':'T shapes','四角':'Squares','C字':'C shapes','W字':'W shapes','P字':'P shapes','一文字':'Lines','魚':'Fish','ナイト':'Knight shapes','変則':'Awkward shapes','L字大':'Large L shapes','稲妻':'Lightning shapes','点':'Dots',
  'コーナーのみ':'Corners only','隣接交換':'Adjacent swaps','対角交換':'Diagonal swaps','G系':'G perms',
  '点→十字':'Dot → Cross','L字→十字':'L → Cross','一文字→十字':'Line → Cross',
  '基本の4形':'Four Basic Cases','両方がU面':'Both pieces on U','エッジのみスロット内':'Edge in slot','コーナーのみスロット内':'Corner in slot','両方スロット内(不正)':'Both in slot (incorrect)',
  '中段にある':'In the middle layer','上面・白が上向き':'On U, white faces up','上面・白が横向き':'On U, white faces sideways','その場で反転している':'Flipped in place',
  'デイジー法 / 直接クロス':'Daisy / Direct Cross','ペア作成→挿入':'Pair → insert','上面を黄色一色に':'Make the top all yellow','側面を揃えて完成':'Permute the sides to finish',
  'PLLパターン認識ガイド':'PLL Recognition Guide','黄色上面は完成済みなので見なくてOK。図ではグレーにし、側面12マスだけを認識対象にしています。':'The yellow top is already solved, so ignore it. It is gray in the diagrams; recognize only the 12 side stickers.',
  'バーを探す':'Find a bar','— 側面3枚が同色なら、その面を基準に持つ。':'— If all three stickers on a side match, hold that side as your reference.','ヘッドライトを探す':'Find headlights','— 同じ面の左右コーナーが同色。1組か、なし／複数かを見る。':'— The two corner stickers on one side match. Check whether there is one pair, none, or multiple.','2枚ブロックを見る':'Find a 2-sticker block','— 隣り合う同色2枚の位置と、反対側の色の流れでケースを絞る。':'— Use the position of an adjacent matching pair and the color flow on the opposite side.','バー':'Bar','バー（3枚同色）':'Bar (3 matching)','ヘッドライト':'Headlights','ヘッドライト（両端）':'Headlights (outer pair)','2枚ブロック':'2-sticker block','2枚ブロック（隣接2枚）':'2-sticker block (adjacent pair)','認識ポイント':'Recognition cues','特徴的な一致なし：4側面の色順を見る':'No obvious match: read the color order around all four sides.',
  'デイジー完成 30秒以内':'Finish the daisy within 30 sec','クロス完成 1分以内':'Finish the Cross within 1 min','ノーミス5連続':'5 clean solves in a row','白面を見ずに8手以内で完成':'Finish within 8 moves without looking at white','クロス10秒以内':'Cross within 10 sec','インスペクション内で完全計画→目をつぶって完成':'Plan fully in inspection → solve with eyes closed'
};
const EN_PARTS=Object.entries(EN).filter(([ja,en])=>ja!==en&&/[ぁ-んァ-ヶ一-龠]/.test(ja)).sort((a,b)=>b[0].length-a[0].length);
const EN_REPL=[
  ['エッジ完成済。2-Lookコーナーと共通','Edges solved; shared with 2-Look corners'],['エッジ向きゼロ','No oriented edges'],['角は完成。2-Look後半と共通','Corners solved; shared with the second half of 2-Look'],['角の隣接2点交換=ヘッドライトが1組','One adjacent corner swap = one pair of headlights'],['ヘッドライトなし','No headlights'],['角も辺も3点交換','Three-cycle of both corners and edges'],
  ['このどれかに持ち込むのがF2Lの全て','Every F2L case reduces to one of these'],['白の向き→分離or直結を判断','Read white orientation → separate or pair directly'],['角を上から合わせて再挿入','Align the corner from above and reinsert'],['一度引き出して基本形へ','Take it out once, then reduce to a basic case'],['作り直し。最悪ケース','Rebuild the pair; worst case'],
  ['2-Look OLL:10手順。①エッジで十字 → ②コーナーの向き','2-Look OLL: 10 algorithms. ① Make the edge cross → ② Orient corners'],['① エッジの向き','① Edge orientation'],['角のマスは無視','Ignore corner stickers'],['② コーナーの向き','② Corner orientation'],['十字グループと共通','Shared with the Cross group'],['フルOLL:57手順。形のグループごとに攻略する','Full OLL: 57 algorithms. Learn by shape group.'],
  ['2-Look PLL:6手順。①コーナー位置 → ②エッジ位置','2-Look PLL: 6 algorithms. ① Position corners → ② Position edges'],['① コーナーの位置','① Corner positions'],['ヘッドライトあり=T/なし=Y','Headlights: T / none: Y'],['② エッジの位置','② Edge positions'],['フルPLL:21手順。側面の色パターンで判別する','Full PLL: 21 algorithms. Identify by side-color patterns.'],
  ['基本4形+代表的な応用4。まずペアを作る→差し込む、の二段で考える','Four basics + four common applications. Think in two steps: pair → insert.'],['全41ケース。スロットはFR(右前)。灰色=無視してよいピース','All 41 cases. Slot is FR (front-right). Gray pieces can be ignored.'],['デイジー法:手順の暗記ゼロで確実に作る','Daisy method: reliable, with no algorithms to memorize'],['直接クロス:8手以内・計画してから回す','Direct Cross: within 8 moves; plan before turning'],
  ['側面の1手で落とす。左右版(R\'・Lなど)も同じ理屈','Drop it with one side turn. Mirrored versions follow the same idea.'],['目的地の真上へ運んで180°','Move it above its target, then turn 180°.'],['隣の面に引っかけて差し込む','Hook it on the adjacent face and insert.'],['一度追い出して入れ直す。最悪ケース','Take it out and reinsert; worst case.'],
  ['OLL 27。最頻出。逆回し=アンチスーン','OLL 27. Most common; reverse = Anti-Sune.'],['OLL 26。スーンの逆','OLL 26. Reverse of Sune.'],['PLL。エッジ3点交換','PLL. Three-edge cycle.'],['PLL。Uaの逆回し','PLL. Reverse of Ua.'],['PLL。セクシーで始まる代表格','PLL. A classic algorithm starting with a Sexy Move.'],['PLL。後半=セクシー+スレッジ','PLL. Second half = Sexy Move + Sledgehammer.'],
  ['上面(Up)','top face (Up)'],['正面(Front)','front face (Front)'],['右面(Right)','right face (Right)'],['底面(Down)','bottom face (Down)'],['背面(Back)','back face (Back)'],['左面(Left)','left face (Left)'],['上2層(Uw)','upper two layers (Uw)'],['前2層(Fw)','front two layers (Fw)'],['右2層(Rw)','right two layers (Rw)'],['下2層(Dw)','lower two layers (Dw)'],['後2層(Bw)','back two layers (Bw)'],['左2層(Lw)','left two layers (Lw)'],['中層 Middle・Lと同方向','middle slice (M), same direction as L'],['中層 Equator・Dと同方向','equator slice (E), same direction as D'],['中層 Standing・Fと同方向','standing slice (S), same direction as F'],['全体をRと同方向に','whole cube, same direction as R'],['全体をUと同方向に','whole cube, same direction as U'],['全体をFと同方向に','whole cube, same direction as F'],
  ['反時計回りに90°','90° counterclockwise'],['時計回りに90°','90° clockwise'],['持ち替え(手数に数えない)','cube rotation (not counted as a move)'],['その面の外側から見て','viewed from outside that face'],['を',' '],['手目','move'],['手まで','moves completed'],['同じ手順×','Repeat ×'],['で元通り',' to return to the start'],['元に戻る回数は長周期','Long cycle before returning'],['手順',' algorithms'],['手',' moves']
];
function toEnglish(raw){
  const m=raw.match(/^(\s*)([\s\S]*?)(\s*)$/),lead=m[1],core=m[2],tail=m[3];if(!core)return raw;
  let out=EN[core]||core;
  if(out===core){for(const [ja,en] of EN_REPL)out=out.split(ja).join(en);for(const [ja,en] of EN_PARTS)out=out.split(ja).join(en);}
  out=out.replace(/(\d+) moves順/g,'$1 algorithms').replace(/(\d+) moves/g,'$1 moves');
  return lead+out+tail;
}
function applyLanguage(rebuildToc=true){
  document.documentElement.lang=LANG;document.title='CFOP Trainer';
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while(n=walker.nextNode()){
    if(n.parentElement?.closest('script,style,#fsHdr,#fpSolveBox'))continue;
    const hasJa=/[ぁ-んァ-ヶ一-龠]/.test(n.nodeValue);
    if(hasJa)n.__ja=n.nodeValue;
    if(LANG==='en'){
      if(!hasJa&&n.__en&&n.nodeValue!==n.__en){n.__en=n.nodeValue;continue;}
      const v=toEnglish(n.__ja||n.nodeValue);n.__en=v;if(n.nodeValue!==v)n.nodeValue=v;
    }else if(n.__ja&&n.nodeValue!==n.__ja)n.nodeValue=n.__ja;
  }
  document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el=>['placeholder','aria-label','title'].forEach(a=>{
    if(!el.hasAttribute(a))return;const key='i18n'+a.replace('-','');let src=el.dataset[key];
    if(!src||/[ぁ-んァ-ヶ一-龠]/.test(el.getAttribute(a))){src=el.getAttribute(a);el.dataset[key]=src;}
    const v=LANG==='en'?toEnglish(src):src;if(el.getAttribute(a)!==v)el.setAttribute(a,v);
  }));
  document.querySelectorAll('#langSeg button').forEach(b=>{const on=b.dataset.lang===LANG;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});
  document.querySelectorAll('[data-progress-id]').forEach(el=>syncProgressControl(el,el.dataset.progressId));
  const lgi=document.getElementById('lgIco');if(lgi){
    lgi.textContent=LANG==='ja'?'🇯🇵':'🇬🇧';
    const label=LANG==='ja'?'Switch to English':'日本語に切り替え';lgi.setAttribute('aria-label',label);lgi.title=label;
  }
  if(typeof syncModeControls==='function')syncModeControls();
  if(rebuildToc)buildSubnav();
  if(typeof FP!=='undefined'&&FP.solving&&FP.plan&&typeof fpRefreshSolve==='function')fpRefreshSolve();
}
let i18nQueued=false;
function queueLanguage(){if(LANG!=='en'||i18nQueued)return;i18nQueued=true;setTimeout(()=>{i18nQueued=false;applyLanguage(false);},0);}
function setLanguage(lang){LANG=lang;try{localStorage.setItem('cfop-lang',lang);}catch(e){}applyLanguage();}
function applyTheme(){
  document.body.dataset.theme=THEME;document.documentElement.dataset.theme=THEME;
  document.querySelectorAll('#themeSeg button').forEach(b=>{const on=b.dataset.theme===THEME;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});
  const thi=document.getElementById('thIco');if(thi)thi.textContent=THEME==='dark'?'☀':'☾';
}
function setTheme(theme){
  if(theme!=='light'&&theme!=='dark')return;
  THEME=theme;THEME_FOLLOWS_SYSTEM=false;
  try{localStorage.setItem('cfop-theme',theme);}catch(e){}
  applyTheme();
}
if(SYSTEM_THEME_QUERY){
  const syncSystemTheme=event=>{if(!THEME_FOLLOWS_SYSTEM)return;THEME=event.matches?'light':'dark';applyTheme();};
  if(typeof SYSTEM_THEME_QUERY.addEventListener==='function')SYSTEM_THEME_QUERY.addEventListener('change',syncSystemTheme);
  else if(typeof SYSTEM_THEME_QUERY.addListener==='function')SYSTEM_THEME_QUERY.addListener(syncSystemTheme);
}
