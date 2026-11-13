/* ================= data ================= */
const OLL={
1:"R U2 R2 F R F' U2 R' F R F'",2:"F R U R' U' F' f R U R' U' f'",3:"f R U R' U' f' U' F R U R' U' F'",4:"f R U R' U' f' U F R U R' U' F'",
5:"r' U2 R U R' U r",6:"r U2 R' U' R U' r'",7:"r U R' U R U2 r'",8:"r' U' R U' R' U2 r",
9:"R U R' U' R' F R2 U R' U' F'",10:"R U R' U R' F R F' R U2 R'",11:"r U R' U R' F R F' R U2 r'",12:"M' R' U' R U' R' U2 R U' M",
13:"F U R U2 R' U' R U R' F'",14:"R' F R U R' F' R F U' F'",15:"r' U' r R' U' R U r' U r",16:"r U r' R U R' U' r U' r'",
17:"F R' F' R2 r' U R U' R' U' M'",18:"r U R' U R U2 r2 U' R U' R' U2 r",19:"r' R U R U R' U' M' R' F R F'",20:"r U R' U' M2 U R U' R' U' M'",
21:"R U2 R' U' R U R' U' R U' R'",22:"R U2 R2 U' R2 U' R2 U2 R",23:"R2 D' R U2 R' D R U2 R",24:"r U R' U' r' F R F'",
25:"F' r U R' U' r' F R",26:"R U2 R' U' R U' R'",27:"R U R' U R U2 R'",28:"r U R' U' M U R U' R'",
29:"R U R' U' R U' R' F' U' F R U R'",30:"F U R U2 R' U' R U2 R' U' F'",31:"R' U' F U R U' R' F' R",32:"L U F' U' L' U L F L'",
33:"R U R' U' R' F R F'",34:"R U R2 U' R' F R U R U' F'",35:"R U2 R2 F R F' R U2 R'",36:"L' U' L U' L' U L U L F' L' F",
37:"F R' F' R U R U' R'",38:"R U R' U R U' R' U' R' F R F'",39:"L F' L' U' L U F U' L'",40:"R' F R U R' U' F' U R",
41:"R U R' U R U2 R' F R U R' U' F'",42:"R' U' R U' R' U2 R F R U R' U' F'",43:"F' U' L' U L F",44:"f R U R' U' f'",
45:"F R U R' U' F'",46:"R' U' R' F R F' U R",47:"F' L' U' L U L' U' L U F",48:"F R U R' U' R U R' U' F'",
49:"r U' r2 U r2 U r2 U' r",50:"r' U r2 U' r2 U' r2 U r'",51:"f R U R' U' R U R' U' f'",52:"R' U' R U' R' U F' U F R",
53:"r' U' R U' R' U R U' R' U2 r",54:"r U R' U R U' R' U R U2 r'",55:"U R U2 R2 U' R U' R' U2 F R F'",
56:"r' U' r U' R' U R U' R' U R r' U r",57:"R U R' U' M' U R U' r'"
};
const OLLG=[
["十字(角のみ)",[21,22,23,24,25,26,27],"エッジ完成済。2-Lookコーナーと共通"],
["エッジのみ",[28,57],""],["T字",[33,45],""],["四角",[5,6],""],["C字",[34,46],""],["W字",[36,38],""],
["P字",[31,32,43,44],""],["一文字",[51,52,55,56],""],["魚",[9,10,35,37],""],["ナイト",[13,14,15,16],""],
["変則",[29,30,41,42],""],["L字大",[47,48,49,50,53,54],""],["稲妻",[7,8,11,12,39,40],""],["点",[1,2,3,4,17,18,19,20],"エッジ向きゼロ"]
];
const OLL2E=[["点→十字","F R U R' U' F' f R U R' U' f'"],["L字→十字","f R U R' U' f'"],["一文字→十字","F R U R' U' F'"]];
const PLL={
Aa:"x R' U R' D2 R U' R' D2 R2 x'",Ab:"x R2 D2 R U R' D2 R U' R x'",E:"x' R U' R' D R U R' D' R U R' D R U' R' D' x",
F:"R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
Ga:"R2 U R' U R' U' R U' R2 U' D R' U R D' U",Gb:"U' R' U' R U D' R2 U R' U R U' R U' R2 D",
Gc:"R2 U' R U' R U R' U R2 U D' R U' R' D U",Gd:"U' R U R' U' D R2 U' R U' R' U R' U R2 D'",
H:"M2 U M2 U2 M2 U M2",Ja:"x R2 F R F' R U2 r' U r U2 x'",Jb:"R U R' F' R U R' U' R' F R2 U' R' U'",
Na:"R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",Nb:"R' U R U' R' F' U' F R U R' F R' F' R U' R",
Ra:"R U' R' U' R U R D R' U' R D' R' U2 R' U'",Rb:"R2 F R U R U' R' F' R U2 R' U2 R U",
T:"R U R' U' R' F R2 U' R' U' R U R' F'",Ua:"R U' R U R U R U' R' U' R2",Ub:"R2 U R U R' U' R' U' R' U R'",
V:"R U2 R' D R U' R U' R U R2 D R' U' R D2",Y:"F R U' R' U' R U R' F' R U R' U' R' F R F'",
Z:"M' U' M2 U' M2 U' M' U2 M2 U"
};
const PLLG=[
["エッジのみ",["Ua","Ub","H","Z"],"角は完成。2-Look後半と共通"],
["コーナーのみ",["Aa","Ab","E"],""],
["隣接交換",["T","F","Ja","Jb","Ra","Rb"],"角の隣接2点交換=ヘッドライトが1組"],
["対角交換",["V","Y","Na","Nb"],"ヘッドライトなし"],
["G系",["Ga","Gb","Gc","Gd"],"角も辺も3点交換"]
];
const PLL2=["T","Y","Ua","Ub","H","Z"];
const F2L=[{"g":"basic","a":"F' U' F"},{"g":"basic","a":"R U R'"},{"g":"basic","a":"U R U' R'"},{"g":"basic","a":"U' F' U F"},{"g":"both-up","a":"F' U F U2 R U R'"},{"g":"both-up","a":"U' R U2 R' U' R U2 R'"},{"g":"both-up","a":"F U2 F2 U' F2 U' F'"},{"g":"both-up","a":"F' U2 F U F' U' F"},{"g":"both-up","a":"U2 R U R' U R U' R'"},{"g":"both-up","a":"U' F' U2 F2 R' F' R"},{"g":"both-up","a":"U R U2 R' U R U' R'"},{"g":"both-up","a":"U2 R U R' F' U' F"},{"g":"both-up","a":"R U2 R' U' R U R'"},{"g":"both-up","a":"R' U2 R2 U R2 U R"},{"g":"both-up","a":"R2 U2 F R2 F' U2 R2"},{"g":"both-up","a":"R U' R' U2 F' U' F"},{"g":"both-up","a":"U F' U F U' F' U' F"},{"g":"both-up","a":"U' R U R' U2 R U' R'"},{"g":"both-up","a":"U R U R' U2 F' U' F"},{"g":"both-up","a":"U2 R2 U2 R' U' R U' R2"},{"g":"both-up","a":"U2 F2 U2 F U F' U F2"},{"g":"both-up","a":"U' R U R' U R U R'"},{"g":"both-up","a":"U F' U' F U F' U2 F"},{"g":"both-up","a":"U' R U' R' U R U R'"},{"g":"edge-in","a":"R U' R' F' U2 F"},{"g":"edge-in","a":"R2 U R2 U R2 U2 R2"},{"g":"edge-in","a":"U' R U' R' U2 R U' R'"},{"g":"edge-in","a":"U' R U R' U F' U' F"},{"g":"edge-in","a":"U R U R' U2 R U R'"},{"g":"edge-in","a":"U F' U' F U' R U R'"},{"g":"corner-in","a":"R U2 R' F' U2 F"},{"g":"corner-in","a":"F' U2 F U2 R U R'"},{"g":"corner-in","a":"U' R U' R' U R U' R'"},{"g":"corner-in","a":"U R' F R F2 U' F"},{"g":"corner-in","a":"U' R U R' U' R U R'"},{"g":"corner-in","a":"U R U R' U' F' U' F"},{"g":"both-in","a":"R U' R U2 F R2 F' U2 R2"},{"g":"both-in","a":"R U' R' U' R U R' U2 R U' R'"},{"g":"both-in","a":"R F U R U' R' F' U' R'"},{"g":"both-in","a":"R U2 R U R' U R U2 R2"},{"g":"both-in","a":"R U F R U R' U' F' R'"}];
const F2LG=[["基本の4形","basic","このどれかに持ち込むのがF2Lの全て"],
["両方がU面","both-up","白の向き→分離or直結を判断"],
["エッジのみスロット内","edge-in","角を上から合わせて再挿入"],
["コーナーのみスロット内","corner-in","一度引き出して基本形へ"],
["両方スロット内(不正)","both-in","作り直し。最悪ケース"]];
const F2LSIMPLE=[0,1,2,3,4,24,30,36];
