window.THREE_JACKS_STAGE = {
  characters: {
    jack_america:{name:'잭',label:'아메리카의 잭',base:'america_jack',side:'left'},
    father:{name:'아버지',base:'ch1_father',side:'right'}, mother_ch1:{name:'어머니',base:'ch1_mother',side:'right'},
    sister:{name:'여동생',base:'ch1_sister',side:'right'}, brother1:{name:'첫째 남동생',base:'ch1_brother1',side:'right'}, youngest:{name:'막내',base:'ch1_youngest',side:'right'},
    carrier:{name:'운반꾼',base:'ch1_carrier',side:'right'}, coworker_ch1:{name:'동료',base:'ch1_coworker',side:'right'}, supervisor_ch1:{name:'감독',base:'ch1_supervisor',side:'right'},
    interpreter:{name:'통역',base:'ch1_interpreter',side:'right'}, elder_ch1:{name:'마을 어른',base:'ch1_elder',side:'right'}, manager:{name:'관리인',base:'ch1_manager',side:'center'},

    jack_africa:{name:'잭',label:'아프리카의 잭',base:'africa_jack',side:'left'},
    lover:{name:'연인',base:'ch2_lover',side:'right'}, child_ch2:{name:'어린 부족원',base:'ch2_child',side:'right'}, elder_ch2:{name:'부족의 어른',base:'ch2_elder',side:'right'},
    euro_trader:{name:'유럽 상인',base:'ch2_euro_trader',side:'right'}, trader:{name:'상인',base:'ch2_trader',side:'right'}, stranger:{name:'낯선 사람',base:'ch2_stranger',side:'right'}, amada:{name:'아마다',base:'ch2_amada',side:'right'}, captain:{name:'선장',base:'ch2_captain',side:'right'}, supervisor_ch2:{name:'감독',base:'ch2_supervisor',side:'right'},

    jack_europe:{name:'잭',label:'유럽의 잭',base:'europe_jack',side:'left'},
    mother_ch3:{name:'어머니',base:'ch3_mother',side:'right'}, market_merchant:{name:'시장 상인',base:'ch3_market_merchant',side:'right'}, pharmacist:{name:'약사',base:'ch3_pharmacist',side:'right'}, recruiter:{name:'투자 모집인',base:'ch3_recruiter',side:'right'},
    tom:{name:'톰',base:'ch3_tom',side:'right'}, landlord:{name:'건물 주인',base:'ch3_landlord',side:'right'}, mentor:{name:'스승 상인',base:'ch3_mentor',side:'right'}, small_merchant:{name:'작은 상인',base:'ch3_small_merchant',side:'right'}, accountant:{name:'회계사',base:'ch3_accountant',side:'right'}, old_partner:{name:'옛 동업자',base:'ch3_old_partner',side:'right'}
  },
  speakerMap: {
    '아버지':'father','어머니@ch1':'mother_ch1','여동생':'sister','첫째 남동생':'brother1','막내':'youngest','운반꾼':'carrier','동료@ch1':'coworker_ch1','감독@ch1':'supervisor_ch1','통역':'interpreter','마을 어른':'elder_ch1','관리인':'manager',
    '연인':'lover','어린 부족원':'child_ch2','부족의 어른':'elder_ch2','유럽 상인':'euro_trader','상인@ch2':'trader','낯선 사람':'stranger','아마다':'amada','선장':'captain','감독@ch2':'supervisor_ch2','끌려가는 사람':'stranger','다른 사람':'stranger',
    '어머니@ch3':'mother_ch3','시장 상인':'market_merchant','약사':'pharmacist','투자 모집인':'recruiter','톰':'tom','건물 주인':'landlord','스승 상인':'mentor','작은 상인':'small_merchant','회계사':'accountant','옛 동업자':'old_partner'
  },
  scenes: {
    prologue:{camera:'slow-in',protagonist:null,states:{}},
    'ch1-s01':{camera:'slow-in',protagonist:'jack_america',states:{jack_america:'healthy',father:'healthy',mother_ch1:'healthy',sister:'healthy',brother1:'healthy',youngest:'healthy'}},
    'ch1-s02':{camera:'pan-right',protagonist:'jack_america',states:{jack_america:'alert',interpreter:'neutral',elder_ch1:'worried'}},
    'ch1-s03':{camera:'slow-in',protagonist:'jack_america',states:{jack_america:'shaken',father:'tense',mother_ch1:'worried',sister:'afraid',brother1:'determined'}},
    'ch1-s04':{camera:'pan-left',protagonist:'jack_america',states:{jack_america:'laboring',carrier:'tired'}},
    'ch1-s05':{camera:'slow-out',protagonist:'jack_america',states:{jack_america:'tired',carrier:'tired',sister:'tired',brother1:'tired'}},
    'ch1-s06':{camera:'slow-in',protagonist:'jack_america',states:{jack_america:'exhausted',coworker_ch1:'exhausted'}},
    'ch1-s07':{camera:'slow-in',protagonist:'jack_america',states:{jack_america:'sick',coworker_ch1:'worried',supervisor_ch1:'cold'}},
    'ch1-s08':{camera:'slow-out',protagonist:'jack_america',states:{jack_america:'weakened',carrier:'somber'}},
    'ch1-s09':{camera:'slow-in',protagonist:'jack_america',states:{jack_america:'critical',coworker_ch1:'sad'}},
    'ch1-end':{camera:'pan-right',protagonist:null,states:{manager:'worried'}},

    'ch2-s01':{camera:'slow-in',protagonist:'jack_africa',states:{jack_africa:'warrior',lover:'healthy',child_ch2:'healthy'}},
    'ch2-s02':{camera:'pan-left',protagonist:'jack_africa',states:{jack_africa:'warrior',elder_ch2:'worried'}},
    'ch2-s03':{camera:'shake-soft',protagonist:'jack_africa',states:{jack_africa:'captured',lover:'panicked'}},
    'ch2-s04':{camera:'pan-right',protagonist:'jack_africa',states:{jack_africa:'bound',child_ch2:'tired',lover:'tired'}},
    'ch2-s05':{camera:'slow-in',protagonist:'jack_africa',states:{jack_africa:'exhausted',euro_trader:'cold',trader:'neutral'}},
    'ch2-s06':{camera:'slow-in',protagonist:'jack_africa',states:{jack_africa:'weakened',stranger:'weakened'}},
    'ch2-s07':{camera:'slow-out',protagonist:'jack_africa',states:{jack_africa:'gaunt',amada:'gaunt',stranger:'gaunt'}},
    'ch2-s08':{camera:'shake-soft',protagonist:'jack_africa',states:{jack_africa:'gaunt',captain:'cold',stranger:'terrified'}},
    'ch2-s09':{camera:'slow-in',protagonist:'jack_africa',states:{jack_africa:'gaunt_arrival',supervisor_ch2:'cold'}},
    'ch2-end':{camera:'slow-out',protagonist:null,states:{}},

    'ch3-s01':{camera:'slow-in',protagonist:'jack_europe',states:{jack_europe:'child',mother_ch3:'sick',market_merchant:'cold',pharmacist:'neutral'}},
    'ch3-s02':{camera:'pan-right',protagonist:'jack_europe',states:{jack_europe:'young_hopeful',recruiter:'smiling',tom:'young'}},
    'ch3-s03':{camera:'slow-out',protagonist:'jack_europe',states:{jack_europe:'shocked',landlord:'neutral'}},
    'ch3-s04':{camera:'slow-in',protagonist:'jack_europe',states:{jack_europe:'grieving',mother_ch3:'critical',pharmacist:'neutral'}},
    'ch3-s05':{camera:'slow-in',protagonist:'jack_europe',states:{jack_europe:'hardened',tom:'concerned'}},
    'ch3-s06':{camera:'pan-left',protagonist:'jack_europe',states:{jack_europe:'merchant',mentor:'cold',small_merchant:'worried'}},
    'ch3-s07':{camera:'slow-in',protagonist:'jack_europe',states:{jack_europe:'merchant_cold',tom:'worried'}},
    'ch3-s08':{camera:'slow-in',protagonist:'jack_europe',states:{jack_europe:'rich',accountant:'neutral'}},
    'ch3-s09':{camera:'shake-soft',protagonist:'jack_europe',states:{jack_europe:'ruined',accountant:'tense',small_merchant:'cold',old_partner:'cold',tom:'cold'}},
    'ch3-s10':{camera:'slow-out',protagonist:'jack_europe',states:{jack_europe:'ruined_sick'}},
    'ch3-end':{camera:'slow-out',protagonist:null,states:{}},
    epilogue:{camera:'slow-out',protagonist:null,states:{}}
  },
  sfxRules: [
    {name:'knock',file:'door_knock.mp3',re:'문을 두드|문 두드|노크'},
    {name:'cough',file:'cough_soft.mp3',re:'기침|열이|열은|병든|아팠|아픈'},
    {name:'coin',file:'coins.mp3',re:'동전|돈을 내|은화'},
    {name:'paper',file:'paper_ledger.mp3',re:'장부|명단|계약|기록'},
    {name:'waves',file:'waves.mp3',re:'파도|대서양|바다'},
    {name:'ship',file:'ship_creak.mp3',re:'선창|배 안|배에 사람|갑판|노예선'},
    {name:'crowd',file:'crowd_murmur.mp3',re:'시장|사람들이 모|집결지'},
    {name:'metal',file:'metal_chain.mp3',re:'쇠사슬|사슬|묶'},
    {name:'impact',file:'impact_soft.mp3',re:'습격|총성|총을|끌고 갔|끌려'},
    {name:'heartbeat',file:'heartbeat.mp3',re:'눈물이|두려|무서|마지막 밤|죽'},
    {name:'fire',file:'fire_ambience.mp3',re:'불빛|횃불|불이'},
    {name:'page',file:'page_turn.mp3',re:'초록색|핵심 개념|그래프'}
  ]
};
