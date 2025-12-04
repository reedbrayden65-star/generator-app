 SSL
ame and domain n Configureups
5.tomated backp auSet u issues
4. logs for anyMonitor y
3. nctionalitload fu file upion
2. Testam creatnup and te sigest users:**
1. Txt stepd)

**Nefiguref conn iyour domai(or ec2-ip` our-ttp://ypp at:** `hyour aess 

**Acceion usuct prodeady for
- ✅ Ro-restart autby PM2 fored 
- ✅ Managproxyrse eveinx with rved via nga
- ✅ Sertent dat persisgreSQL foring Poste
- ✅ Us instancur EC2unning on yo
- ✅ Ris now:app or Ops our Generatary

Yumm
## S---

```

qlstgrespot ctl restarem
sudo systreSQLostgstart Psql

# Rereus postgemctl stats
sudo syststatugreSQL # Check Postt

-h localhos_ops  generatorer -dor_us -U generatsql
ptionnnect coash
# Tes`bues
``ction issse conne### Databa```

st/
/diwebtor-ops/generar/projects/me/ec2-use
ls -la /hoists exrontend file f
# Verifyog
inx/error.lar/log/ng-f /vil udo tas
snx logheck nginx -t

# Co ngi
sudx configk nginChec``bash
# 
`ding not loantend

### Fro
```ostalh loc -henerator_opsr_user -d g -U generatoction
psqlconnek database 
# Checps-backend
 generator-o2 logs
pmck PM2 logshe:3001

# Clsof -i udo n use
s001 is irt 3heck if po``bash
# Cstart
`ckend won't Bating

### eshooblart 7: Trou---

## P

nx
``` reload ngictlstem
sudo syload nginxnd

# Re-backeator-opsner ge2 restartkend
pmRestart bac build

# unstall
npm rm inackend
npd ../bnd
ckeild bacRebuld

# m run buitall
npb
npm insend
cd weontebuild fr
# Rin main
ull origgit p code
 latest

# Pullnerator-opscts/geojeprc2-user/
cd /home/e

```bashonplicati3: Update ap## Step 6.`

#ckup.sql
`` baor_ops <atr genernerator_usepsql -U geckup
e from ba
# Restorbackup.sql
tor_ops > _user generaeratorU genp -g_dumackup
p# Manual b
```bash
atabase
p dku.2: Bacep 6

### St.log
```/postgresqlg/postgresql -f /var/loudo tailgs
sgreSQL lo
# Postlog
/error.nginxg/-f /var/lotail g
sudo access.log/nginx/ar/lol -f /vdo tai logs
su
# Nginxbackend
ops-enerator-ogs gogs
pm2 lackend l`bash
# B
``
gsew loStep 6.1: Vi
### nce
 & Maintenanitoring Part 6: Mo

##```

---art nginx
temctl restudo sysnginx -t
sOF

sudo }
Ede;
    }
tp_upgraass \$htypy_cache_bproxt;
         Host \$hosset_header    proxy_rade';
     'upgionnectonder C_set_hearoxy      p
  p_upgrade; \$httpgradeer Uet_headoxy_s pr   n 1.1;
    http_versio      proxy_ckend;
  http://bay_pass prox      
  ion /api/ {cat }

    lo   html;
/index.\$uri/ es \$uri  try_fil       dist;
b/ops/wetor-s/generajectec2-user/pro /home/      root  tion / {

    locavkey.pem;
n.com/priur-domaie/yot/livypetc/letsencre_key /ficat  ssl_certi;
  hain.pemcom/fullcain./your-domt/livecrypetsen/lificate /etc ssl_cert   ain.com;

r-dome yourver_nam    se
 http2;sl43 slisten 4
    

server {est_uri;
}equ$rr_name\\$serves://01 httpn 3retur  .com;
  omainyour-dme server_nan 80;
     liste   rver {
}

sehost:3001;
er local{
    serv backend am
upstreull << EOFv/n> /deor-ops able/generatilx/sites-avaginee /etc/n
sudo t

```bashTTPSnginx for Hpdate tep 5.2: U```

### Ser
tbot.timble cer enasystemctl
sudo o-renew# Autin.com

omanx -d your-drtonly --ngitbot cen)
sudo ceraiom de with yourte (replacifica
# Get certt-nginx
tbo-cern3ertbot pythoall -y capt inst
sudo 

```bashcrypt's En with Letertificatel SSL cnstal.1: I
### Step 5mmended)
l but Reco (Optionacurity & SSL 5: Se## Part

---

ost/
```localhp://httl ntend
cur
# Test froth
eali/h01/aplhost:30catp://locurl htst API
inx

# Te status ng systemctlnx
sudock ngi

# Che status status
pm2eck PM2bash
# Ch
```ng
runniis verything erify etep 4.2: V`

### Sve
``2 sa startup
pm
pm2t on reboottar to rese PM2 configSav
# 
ckend"tor-ops-bae "generaver.js --namt dist/ser starith PM2
pm2tart w
# Sn build
pt
npm rupeScrild TyBui
# ckend
s/baerator-op/gener/projectsec2-usd /home/``bash
c2

`ith PM backend w startld and: Buip 4.1# Ste PM2

##y witht 4: Deplo
## Par
---

```
ginxart n restdo systemctlt nginx
suar Restx -t

#nginudo ig
s nginx conf Test
#ed/
es-enablinx/sit/ngor-ops /etceratlable/gentes-avaic/nginx/si/etsf ln -o e site
sud
# Enabl
}
EOF
 }de;
   $http_upgrae_bypass \xy_cach      pro$host;
  er Host \headroxy_set_ p
       pgrade';ection 'uheader Connt_ proxy_se
       tp_upgrade;e \$ht Upgradeaderet_hxy_s pro       on 1.1;
rsi_vexy_httpro    p
    end;backpass http://y_rox     p{
   api/ ion /atI
    loc# Backend AP       }

 ex.html;
/ /indri\$u \$uri   try_filesst;
      s/web/dinerator-op/projects/gee/ec2-user  root /hom
      on / {
    locatirontend# F  
  ec2-ip;
e your-nam
    server_en 80;   listr {
 
serve:3001;
}
r localhost    serveackend {
pstream bl << EOF
uuldev/n> /-ops generatore/bls-availaitec/nginx/see /eth
sudo tnx

```basfigure ngiCon Step 3.2: ##
```

#imized files with optdist' folderes a ' creat This

#ld
npm run buiproductionr ild fo

# Bum installs
npendencie Install dep

#/webpsnerator-ots/geprojecuser//home/ec2-```bash
cd d

nten1: Build fro Step 3.etup

###end S: Front
## Part 3-
--p
```

+C to stos Ctrl01"
# Pres port 30running onServer ld see: "Shoun dev
# 
npm ru

```bashally backend locestp 2.8: T

### Ste```"
  }
}
tsc --watch: "  "watch"r.js",
  rvest/seode ditart": "n,
    "s "tsc"ild":  "bu",
  ver.tssrc/ser: "ts-node   "dev": {
  ts"
  "scrip
{json

``` scriptsge.json packa: Updateep 2.7St
### ;
```


start();
  }
}t(1)exiocess.
    pr error);',art server:d to str('Faileonsole.erro   crror) {
 } catch (e  });

    );{PORT}`ng on port $runnier (`Servlognsole.
      coORT, () => {en(P app.list  
  
   tabase();tializeDaait iniry {
    aw) {
  ton start(unctisync f server
artstaase and databtialize // Ini
});

 });e()atnew Damp: ok', timest status: '  res.json({ {
req, res) => (th',/healapip.get('/ check
ap Health);

//e })d: tru extende '50mb',limit:ded({ urlencoe(express.());
app.usress.jsonse(exppp.ue,
}));
a: trucredentials  
END_URL,ONTFR.env. process
  origin:ors({app.use(ceware
// Middl 3001;

.env.PORT ||ocessst PORT = pr
con;()ess = exprt app
consonfig();
v.c';

dotentabasels/daode} from './mtabase tializeDaol, { iniimport ponv';
otev from 'd doten
importors';om 'ct cors fr
imporess';from 'exprpress t excript
impor
```typeser.ts`:
servsrc/
Create `s server
e Expres: Creat# Step 2.6
```

##
}();
  }ient.releasey {
    cl finall);
  }uccessfully'zed sase initialie.log('Databol;
    consd);
    `)eam_i ON users(ts_team_iderx_usTS idIF NOT EXISE INDEX REAT      Ctatus);
ON tasks(satus _st idx_tasksTSEXISEX IF NOT E IND    CREATid);
   tasks(team_am_id ON_te_tasksEXISTS idxOT X IF N CREATE INDE         );

 TAMP
 URRENT_TIMEST CULMP DEFAMESTAdated_at TIup       P,
 IMESTAMENT_TAULT CURRMESTAMP DEFt TIeated_a   cr   '[]',
  B DEFAULT ON comments JS     s(id),
  ENCES taskREFERd INTEGER nt_task_i   pare
     E,date DATrence_end_ recur    ,
    INTEGERvalintere_urrenc     rec0),
   e VARCHAR(5currence_typ  re   ,
   255)ink VARCHAR(im_ticket_l
        s255),RCHAR(t_number VAsim_ticke        
),S users(idER REFERENCE_id INTEGuseraimed_by_cl
        (id),sersCES uRENEGER REFE_user_id INTsigned_to   as,
     rrent'FAULT 'CuR(50) DEARCHAs Vstatu         NULL,
DATE NOT   due_date 50),
     ype VARCHAR(  task_tXT,
      cription TE_desask
        tULL, N(255) NOTARCHARk_title Vas  t   T NULL,
   R(255) NOd VARCHAor_inerat
        geLL,255) NOT NUARCHAR(e Vam  building_n  ,
    ) NOT NULL teams(idNCES REFEREid INTEGER    team_Y,
    KE PRIMARY SERIAL
        id STS tasks (EXI NOT ABLE IFTE T
      CREA    );
  MESTAMP
RRENT_TIDEFAULT CUTAMP ES_at TIM     created,
   EFAULT FALSEed BOOLEAN Difi    ver',
    'MEMBER DEFAULT ARCHAR(50)ole V        rid),
 teams(R REFERENCESGEINTEid       team_
  ) NOT NULL,HAR(255hash VARCpassword_         NOT NULL,
VARCHAR(255)name         LL,
UE NOT NUNIQ255) UCHAR(   email VAREY,
     RY KPRIMA SERIAL 
        id (S usersT EXISTBLE IF NOREATE TA

      C     );MP
 ESTATIMRRENT_T CUFAULMP DE TIMESTAateated_      cr
  LT FALSE,LEAN DEFAUd BOOloadeain_up br    ULL,
   55) NOT Ne VARCHAR(2nam  
      NOT NULL,IQUE UNHAR(50)   code VARC
      IMARY KEY,d SERIAL PR
        is (S teamIF NOT EXIST TABLE   CREATE  uery(`
   client.q
    await);
  try {.connect(ool pent = awaitt clionsase() {
  ctabDainitializeunction c fort asynxp
eeslize tablnitia

// Iool;efault p

export dRL,
});BASE_Us.env.DATAoces prring:ionSt
  connectl({ Pooewnst pool = nco);

nv.config(v';

dotem 'dotenv fromport dotenrom 'pg';
il } ft { Poopor
im`typescript`:

``base.tsmodels/data `src/

Createse modelsbaatareate d.5: C Step 2``

###
`
EOFip:3000your-ec2-ttp://URL=hND_S
FRONTEOR60

# C104857_FILE_SIZE=
MAX./uploadsR=UPLOAD_DI
ile uploadss

# Fy-change-thikesecret-jwt-our-super-ET=y
JWT_SECRJWTion

# _ENV=product3001
NODEver
PORT=ps

# Sererator_o/gen32host:54here@locald-asswore-pecur_user:your-s/generatorql:/=postgresTABASE_URLabase
DAEOF
# Datt > .env << h
ca

```baslee .env fieatep 2.4: Cr

### Sts"]
}
```"node_modulexclude": [,
  "erc/**/*"]: ["slude"},
  "inc  ue
Map": tr  "source
  : true,p"arationMa
    "declon": true,larati
    "dec": true,lesonModu  "resolveJ
  ue,es": tringInFileNamistentCasns   "forceCo,
 ue": trpLibCheck"ski   true,
 rop": uleInteesMod   " true,
 "strict":
    c","./srootDir": ,
    "rist"ir": "./doutD  "0"],
  "ES202": [  "libs",
   "commonjmodule":,
    "S2020""Eget":     "tar {
ptions":erO  "compil
{


```jsonnfig.jsonCreate tsco3: ### Step 2.`

fig.json
``ch tscontounv
h .etoucserver.ts
 src/fig}
touchutils,conddleware,ls,miutes,modep src/{roir -
mkd``bashture

`kend strucbac Create # Step 2.2:
##n
```
emonods/express pe @tynode @types/pt ts-nodeypescriinstall -D t
npm tokennwebsoyptjs jos bcrter axi pg mulnvs cors dote expresm installencies
npll depend
# Instait -y
ject
npm inproalize Node 
# Initikend
accd bbackend
 -p ctory
mkdirreackend dieate bops

# Crtor- generaps
cdator-oer genl>repo-uryour- <clonet 
giew backend)eate ncr (or epositoryClone your rts

# cd projecs
ect projdir -pser
mkome/ec2-u
cd /h

```bashtup backendne and sep 2.1: Clo

### Steend SetupBackPart 2: ## 



---``t
`q to exi\pe # Tyt
oss -h localhopor_ -d generatator_userl -U generpsqction
 conneifyF

# Ver
EO\q;
rator_usergene TO or_opsatnergeBASE S ON DATAVILEGERIT ALL P
GRANonly TO off;ction_read__transaaultET defuser Srator_eneER ROLE g
ALTO on;eferrable Tnsaction_d_tra SET defaultsernerator_uLTER ROLE ge
Aed';mittO 'read com Tisolationnsaction_ default_trar SETtor_usera gene
ALTER ROLE8';g TO 'utfent_encodin SET clierator_userER ROLE genere';
ALTword-hre-passD 'your-secuSWORAS WITH Pr_userneratogeATE USER 
CREr_ops;toE generaTE DATABAS< EOF
CREA psql <ostgres-u psudo r
d usebase anreate data Csql

# postgreablestemctl endo sysql
supostgrestart systemctl eSQL
sudo tart Postgr```bash
# S

greSQLre Postonfigup 1.3: CSte`

### ion
``--verssion
psql npm --verversion

node --nsinstallatioerify 2

# Vll -g pm insta
sudo npm manager)M2 (process P# Installinx

 ngall -yapt insto 
sudxy)reverse pronginx (ll 

# Instal-contribstgresq posql-y postgret install o ap
sudstgreSQL# Install Po nodejs

stall -y
sudo apt in bash - -Esudo | up_18.xce.com/setb.nodesours://dehttpl -fsSL LTS)
cur18 .js (vll Node Insta-y

#apt upgrade te
sudo apt upda`bash
sudo 

``dependenciesinstall d  system an Update 1.2:tep# S

##ip
```blic-2-pu-ec@your.pem ubuntukeyour-:
ssh -i yntu Ubuip
# or if-ec2-public-r@yourseey.pem ec2-u -i your-kash
ssh```bour EC2

o yect t.1: Conn### Step 1etup

t 1: EC2 S# Par

#--onal)

-ploads (optile ut for fi3 bucke SWSnded)
- Aecomme but rional,ame (optin n- DomaEC2
 to your  SSH accessd)
-ende LTS recommUbuntu 22.04ce running (2 instanites

- ECerequis
## Pr)
```
ocal l(S3 ororage le St      Fi                       
       ↓                                  base
     atatgreSQL D→ Posress) (Exps Backend → Node.j(Vite) nd t Frontesers → Reacre

```
Uitectu
## Arch.
end, and front databaseend,a full backh ance witnst iur EC2 to yoenerator Opseploying G through dde walks youew
This gui

## OverviGuideDeployment  - Complete enerator Ops# G