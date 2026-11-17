/**
 * Verse-card rotation, part 2, plus French/Arabic reflections for part 1.
 *
 * Each line: "REF|topic|English reflection|French reflection|Arabic reflection".
 * References use World English Bible numbering (refKey format) and are
 * validated against all installed editions by scripts/validate-content.ts
 * and tests/content.test.ts. Reflections are ORIGINAL EDITORIAL TEXT (not
 * Scripture) and are always labelled “Reflection” in the interface.
 */

/** French and Arabic reflections for the first 45 cards (dv-001 … dv-045). */
export const PHRASES_FR_AR: Record<string, [string, string]> = {
  "dv-001": ["Vous êtes aimé avant d’avoir tout compris.", "أنت محبوب قبل أن تفهم كل شيء."],
  "dv-002": ["Laissez-vous conduire au repos aujourd’hui.", "دع نفسك تُقاد إلى الراحة اليوم."],
  "dv-003": ["Échangez un souci contre une prière de gratitude.", "استبدل همًّا واحدًا بصلاة شكر."],
  "dv-004": ["La fatigue n’est pas la fin ; la force se renouvelle.", "التعب ليس النهاية؛ القوة تتجدّد."],
  "dv-005": ["Une miséricorde nouvelle vous attend ce matin.", "رحمة جديدة تنتظرك هذا الصباح."],
  "dv-006": ["Vous n’avez pas à tout porter seul.", "لست مضطرًا أن تحمل كل شيء وحدك."],
  "dv-007": ["Rien aujourd’hui ne peut vous séparer de son amour.", "لا شيء اليوم يفصلك عن محبته."],
  "dv-008": ["Confiez à Dieu même les petites décisions.", "سلّم لله حتى القرارات الصغيرة."],
  "dv-009": ["Où que vous alliez aujourd’hui, vous n’êtes pas seul.", "أينما ذهبت اليوم لست وحدك."],
  "dv-010": ["L’honnêteté devant Dieu rencontre la miséricorde.", "الصدق أمام الله يلقى الرحمة."],
  "dv-011": ["Quand tout tremble, il reste un refuge.", "حين يهتز كل شيء يبقى ملجأ."],
  "dv-012": ["Un acte juste, un mot bon, un pas humble.", "عمل عادل، وكلمة طيبة، وخطوة متواضعة."],
  "dv-013": ["Le bon fruit pousse lentement. Continuez.", "الثمر الطيب ينمو ببطء. واصل النمو."],
  "dv-014": ["L’amour est patient — commencez par une personne.", "المحبة تتأنّى — ابدأ بشخص واحد اليوم."],
  "dv-015": ["Vous avez été fait avec soin.", "لقد صُنعت بعناية."],
  "dv-016": ["Juste aujourd’hui. Dieu tient demain.", "اليوم فقط. الله يمسك الغد."],
  "dv-017": ["La grâce vous rejoint là où vous êtes faible.", "النعمة تلقاك حيث تشعر بالضعف."],
  "dv-018": ["Dans le deuil, Dieu s’approche.", "في الحزن يقترب الله."],
  "dv-019": ["Ceux qui sont pardonnés peuvent pardonner.", "من نال الغفران يستطيع أن يغفر."],
  "dv-020": ["Faites le prochain pas avec confiance.", "خُذ الخطوة التالية بثقة."],
  "dv-021": ["Il est permis de demander la sagesse.", "لا بأس أن تطلب الحكمة."],
  "dv-022": ["Le secours vient du créateur du ciel et de la terre.", "المعونة من صانع السماء والأرض."],
  "dv-023": ["Une paix que le monde ne donne ni ne reprend.", "سلام لا يعطيه العالم ولا يأخذه."],
  "dv-024": ["Ce que vous méditez vous façonne.", "ما تتأمّل فيه يشكّل من تصير."],
  "dv-025": ["Dieu vous a déjà précédé.", "الله قد سبقك."],
  "dv-026": ["Revêtez-vous de bonté aujourd’hui.", "البس اللطف اليوم."],
  "dv-027": ["Un cœur pur est un don que l’on peut demander.", "القلب النقي عطية يمكنك أن تطلبها."],
  "dv-028": ["Remettez le souci ; on prend soin de vous.", "سلّم الهمّ؛ هو يعتني بك."],
  "dv-029": ["Il y a de la grâce pour cette saison.", "هناك نعمة لهذا الموسم."],
  "dv-030": ["Aimez Dieu, et la personne devant vous.", "أحبّ الله، وأحبّ من أمامك."],
  "dv-031": ["Comptez un bienfait à voix haute aujourd’hui.", "عُدّ بركة واحدة بصوت عالٍ اليوم."],
  "dv-032": ["La gratitude est possible, même ici.", "الشكر ممكن حتى هنا."],
  "dv-033": ["Ne crains pas — Dieu est avec toi.", "لا تخف — الله معك."],
  "dv-034": ["Restez proche ; le fruit suivra.", "ابقَ قريبًا؛ والثمر يتبع."],
  "dv-035": ["Votre lumière, c’est Dieu lui-même.", "نورك هو الله نفسه."],
  "dv-036": ["Approchez avec assurance ; la miséricorde est prête.", "تقدّم بثقة؛ الرحمة جاهزة."],
  "dv-037": ["Que votre espérance déborde sur quelqu’un.", "ليفِض رجاؤك على غيرك."],
  "dv-038": ["Assez de lumière pour le prochain pas.", "نور يكفي للخطوة التالية."],
  "dv-039": ["Soyez artisan de paix dans une conversation.", "كن صانع سلام في حديث واحد."],
  "dv-040": ["Dieu prend plaisir en vous.", "الله يُسرّ بك."],
  "dv-041": ["La perte n’a pas le dernier mot.", "الفقد ليس الكلمة الأخيرة."],
  "dv-042": ["Continuez à faire le bien ; la moisson vient.", "واصل فعل الخير؛ الحصاد آتٍ."],
  "dv-043": ["Faites de Dieu vos délices, confiez-lui vos projets.", "تلذّذ بالله وسلّمه خططك."],
  "dv-044": ["La grâce est un don, pas une note.", "النعمة هبة لا درجة تُكتسب."],
  "dv-045": ["Que le Seigneur vous garde et vous donne la paix.", "ليحفظك الرب ويمنحك السلام."],
};

/** Cards dv-046 … dv-365. */
export const EXTRA_CARDS = `GEN.1.1|creation|In the beginning, God.|Au commencement, Dieu.|في البدء، الله.
GEN.1.27|identity|You bear God’s image.|Vous portez l’image de Dieu.|أنت تحمل صورة الله.
GEN.28.15|presence|God goes with you wherever you go.|Dieu vous accompagne partout où vous allez.|الله معك حيثما ذهبت.
GEN.50.20|providence|God can bring good out of harm.|Dieu peut tirer le bien du mal.|يقدر الله أن يُخرج خيرًا من الشر.
EXO.14.14|trust|Be still; God fights for you.|Restez tranquille ; Dieu combat pour vous.|اهدأ؛ الرب يقاتل عنك.
EXO.15.2|praise|Let God be your song today.|Que Dieu soit votre chant aujourd’hui.|ليكن الله ترنيمتك اليوم.
EXO.33.14|rest|His presence goes with you; rest.|Sa présence vous accompagne ; reposez-vous.|حضوره يسير معك؛ فاسترح.
LEV.19.18|love|Love your neighbour as yourself.|Aimez votre prochain comme vous-même.|أحبّ قريبك كنفسك.
DEU.6.5|love|Love God with all you are.|Aimez Dieu de tout votre être.|أحبّ الله بكل كيانك.
DEU.7.9|faithfulness|God keeps his promises.|Dieu tient ses promesses.|الله يحفظ عهده.
DEU.33.27|refuge|Underneath are the everlasting arms.|Sous vous, les bras éternels.|ومن تحتك أذرع أبدية.
JOS.24.15|choice|Choose today whom you will serve.|Choisissez aujourd’hui qui vous servirez.|اختر اليوم من تعبد.
RUT.1.16|loyalty|Faithful love stays.|L’amour fidèle reste.|المحبة الأمينة تبقى.
1SA.16.7|identity|God looks at the heart.|Dieu regarde au cœur.|الله ينظر إلى القلب.
2SA.22.31|trust|God’s way is perfect.|La voie de Dieu est parfaite.|طريق الله كامل.
1KI.19.12|stillness|Listen for the quiet voice.|Écoutez la voix douce et calme.|أصغِ إلى الصوت المنخفض الخفيف.
1CH.16.11|seeking|Seek his face always.|Cherchez sans cesse sa face.|اطلب وجهه دائمًا.
1CH.16.34|gratitude|Give thanks; his love endures.|Rendez grâce ; son amour demeure.|احمد الرب؛ رحمته باقية.
2CH.7.14|repentance|Humble prayer opens the way to healing.|La prière humble ouvre la voie à la guérison.|الصلاة المتواضعة تفتح طريق الشفاء.
NEH.8.10|joy|The joy of the Lord is your strength.|La joie de l’Éternel est votre force.|فرح الرب قوتك.
EST.4.14|purpose|Maybe you are here for such a time as this.|Peut-être êtes-vous là pour un temps comme celui-ci.|ربما أنت هنا لمثل هذا الوقت.
JOB.19.25|hope|Your Redeemer lives.|Votre Rédempteur est vivant.|وليّك حيّ.
JOB.42.2|sovereignty|Nothing stops God’s purposes.|Rien n’arrête les desseins de Dieu.|لا يعسر على الله أمر.
PSA.1.1-2|wisdom|Delight in God’s word and grow.|Prenez plaisir à la Parole et grandissez.|افرح بكلمة الله وانمُ.
PSA.4.8|rest|Lie down in peace tonight.|Couchez-vous en paix ce soir.|اضطجع بسلام الليلة.
PSA.16.11|joy|In his presence is fullness of joy.|En sa présence, plénitude de joie.|أمامه شبع سرور.
PSA.19.14|words|May your words and thoughts please God.|Que vos paroles et vos pensées plaisent à Dieu.|لتكن أقوالك وأفكارك مرضية لله.
PSA.25.4-5|guidance|Ask to be taught his paths.|Demandez à apprendre ses sentiers.|اطلب أن تتعلّم سبله.
PSA.30.5|hope|Joy comes in the morning.|Le matin vient la joie.|في الصباح ترنّم.
PSA.31.24|courage|Take courage, you who hope.|Prenez courage, vous qui espérez.|تشدّدوا يا جميع المنتظرين.
PSA.32.8|guidance|God will guide you with his eye on you.|Dieu vous conduira, son regard sur vous.|يرشدك الله وعينه عليك.
PSA.33.4|faithfulness|His word is right; his work is faithful.|Sa parole est droite, son œuvre fidèle.|كلمته مستقيمة وعمله بالأمانة.
PSA.34.8|goodness|Taste and see that God is good.|Goûtez et voyez que Dieu est bon.|ذوقوا وانظروا ما أطيب الرب.
PSA.40.1-2|patience|Waiting is not wasted.|L’attente n’est pas perdue.|الانتظار ليس ضائعًا.
PSA.42.11|hope|Hope again in God.|Espérez de nouveau en Dieu.|ترجَّ الله من جديد.
PSA.55.22|burden|Cast your burden on the Lord.|Remettez votre fardeau à l’Éternel.|ألقِ على الرب همّك.
PSA.56.3|fear|When afraid, trust.|Quand la peur vient, faites confiance.|في يوم خوفك اتّكل عليه.
PSA.62.1-2|rest|Your soul can rest in God alone.|Votre âme peut se reposer en Dieu seul.|لنفسك راحة في الله وحده.
PSA.63.1|longing|Your thirst points you to God.|Votre soif vous conduit vers Dieu.|عطشك يقودك إلى الله.
PSA.73.26|strength|God is the strength of your heart.|Dieu est le rocher de votre cœur.|الله صخرة قلبك.
PSA.84.10|worship|One day near God is better.|Un jour près de Dieu vaut mieux.|يوم واحد في حضرته خير.
PSA.86.5|forgiveness|God is ready to forgive.|Dieu est prêt à pardonner.|الله غفور.
PSA.90.12|time|Number your days; gain a wise heart.|Comptez vos jours ; gagnez un cœur sage.|أحصِ أيامك فتنال قلب حكمة.
PSA.91.1-2|refuge|Dwell in the shelter of the Most High.|Demeurez à l’abri du Très-Haut.|اسكن في ستر العلي.
PSA.95.1|praise|Come, sing for joy to God.|Venez, chantons avec joie à Dieu.|هلمّ نرنّم للرب.
PSA.100.4-5|gratitude|Enter with thanksgiving.|Entrez avec des louanges.|ادخل بالحمد.
PSA.103.12|forgiveness|As far as the east is from the west.|Aussi loin que l’orient est de l’occident.|كبُعد المشرق من المغرب.
PSA.107.1|gratitude|His kindness endures forever.|Sa bonté dure à toujours.|إلى الأبد رحمته.
PSA.118.24|joy|This is the day; rejoice in it.|Voici le jour ; réjouissez-vous.|هذا هو اليوم؛ فلنفرح فيه.
PSA.119.11|word|Keep God’s word in your heart.|Gardez la Parole dans votre cœur.|احفظ كلمته في قلبك.
PSA.121.7-8|protection|He keeps your going out and coming in.|Il garde votre départ et votre arrivée.|يحفظ خروجك ودخولك.
PSA.127.1|work|Let God build what you build.|Laissez Dieu bâtir ce que vous bâtissez.|دع الرب يبني ما تبنيه.
PSA.130.5|waiting|Wait and hope in his word.|Attendez et espérez en sa parole.|انتظر وارجُ كلمته.
PSA.133.1|unity|Unity is good and pleasant.|L’unité est bonne et agréable.|ما أحسن الوحدة وما أجملها.
PSA.136.1|gratitude|Thank God; his mercy lasts.|Rendez grâce ; sa bonté demeure.|احمدوا الرب؛ رحمته إلى الأبد.
PSA.143.8|trust|Listen for his love this morning.|Écoutez son amour ce matin.|اسمع رحمته في الصباح.
PSA.145.18|prayer|God is near all who call on him.|Dieu est près de tous ceux qui l’invoquent.|الرب قريب لكل الذين يدعونه.
PSA.147.3|healing|He heals the broken-hearted.|Il guérit les cœurs brisés.|يشفي المنكسري القلوب.
PSA.150.6|praise|Let everything that breathes praise.|Que tout ce qui respire loue.|كل نسمة فلتسبّح.
PRO.1.7|wisdom|Wisdom begins with reverence for God.|La sagesse commence par la crainte de Dieu.|بدء الحكمة مخافة الرب.
PRO.4.23|heart|Guard your heart.|Gardez votre cœur.|احفظ قلبك.
PRO.15.1|words|A gentle answer turns away anger.|Une réponse douce calme la colère.|الجواب اللين يصرف الغضب.
PRO.16.3|work|Commit your work to God.|Recommandez votre œuvre à Dieu.|سلّم أعمالك للرب.
PRO.16.9|guidance|You plan; God directs the steps.|Vous projetez ; Dieu dirige vos pas.|أنت تفكّر والرب يهدي خطواتك.
PRO.17.17|friendship|A friend loves at all times.|L’ami aime en tout temps.|الصديق يحب في كل وقت.
PRO.18.10|refuge|God’s name is a strong tower.|Le nom de l’Éternel est une tour forte.|اسم الرب برج حصين.
PRO.19.21|purpose|God’s purpose will stand.|Le dessein de Dieu s’accomplira.|مشورة الرب هي تثبت.
PRO.27.17|friendship|Friends sharpen each other.|Les amis s’aiguisent l’un l’autre.|الصديق يشحذ صديقه.
PRO.31.25|strength|Clothed with strength and dignity.|Revêtue de force et de dignité.|العزّ والبهاء لباسها.
ECC.3.11|beauty|He makes everything beautiful in its time.|Il fait toute chose belle en son temps.|صنع الكل حسنًا في وقته.
PRO.2.6|wisdom|Wisdom comes from God.|La sagesse vient de Dieu.|الرب يعطي الحكمة.
SNG.8.7|love|Many waters cannot quench love.|Les grandes eaux n’éteignent pas l’amour.|مياه كثيرة لا تطفئ المحبة.
ISA.7.14|christmas|God with us.|Dieu avec nous.|الله معنا.
ISA.12.2|trust|Trust and do not be afraid.|Ayez confiance, sans crainte.|اتّكل ولا ترتعب.
ISA.26.3|peace|A steady mind finds perfect peace.|Un esprit ferme trouve la paix parfaite.|الثابت في الله يُحفظ في سلام.
ISA.30.15|rest|In quietness and trust is strength.|Dans le calme et la confiance, la force.|بالهدوء والثقة تكون قوتك.
ISA.40.8|word|God’s word stands forever.|La parole de Dieu demeure à jamais.|كلمة إلهنا تثبت إلى الأبد.
ISA.40.29|strength|He gives power to the weary.|Il donne de la force à celui qui est las.|يعطي المُعيي قدرة.
ISA.43.1|identity|You are called by name.|Vous êtes appelé par votre nom.|دعاك باسمك.
ISA.43.2|presence|Through deep waters, he is with you.|Dans les eaux profondes, il est avec vous.|في المياه العميقة هو معك.
ISA.43.18-19|newness|God is doing a new thing.|Dieu fait une chose nouvelle.|الله يصنع أمرًا جديدًا.
ISA.49.15-16|love|You are engraved on his hands.|Vous êtes gravé sur ses mains.|أنت منقوش على كفّيه.
ISA.53.5|cross|By his wounds we are healed.|Par ses blessures, nous sommes guéris.|بجُبره شُفينا.
ISA.54.10|faithfulness|His kindness will not depart.|Sa bonté ne s’éloignera pas.|إحسانه لا يزول عنك.
ISA.55.8-9|trust|His ways are higher.|Ses voies sont plus élevées.|طرقه أعلى من طرقنا.
ISA.58.11|guidance|God will guide you continually.|Dieu vous conduira sans cesse.|يقودك الرب على الدوام.
ISA.61.1|freedom|Good news for the broken-hearted.|Une bonne nouvelle pour les cœurs brisés.|بشارة للمنكسري القلوب.
ISA.45.22|salvation|Turn to him and be saved.|Tournez-vous vers lui et soyez sauvés.|التفتوا إليه واخلصوا.
JER.17.7-8|trust|Roots near water stay green.|Des racines près de l’eau restent vertes.|الجذور عند المياه تبقى خضراء.
JER.29.11|hope|God has plans of peace for you.|Dieu a pour vous des projets de paix.|لله أفكار سلام لك.
JER.29.13|seeking|Seek him with all your heart.|Cherchez-le de tout votre cœur.|اطلبه بكل قلبك.
JER.31.3|love|Loved with an everlasting love.|Aimé d’un amour éternel.|محبوب بمحبة أبدية.
JER.32.17|power|Nothing is too hard for God.|Rien n’est trop difficile pour Dieu.|لا يعسر على الله شيء.
JER.33.3|prayer|Call, and he will answer.|Invoquez-le, il répondra.|ادعُه فيجيبك.
EZK.36.26|newness|A new heart is possible.|Un cœur nouveau est possible.|قلب جديد ممكن.
DAN.2.20-21|wisdom|Wisdom and power belong to God.|Sagesse et force appartiennent à Dieu.|لله الحكمة والجبروت.
HOS.6.3|knowing|Press on to know God.|Cherchez à connaître Dieu.|لنتتبّع لنعرف الرب.
JOL.2.13|repentance|Return; he is gracious.|Revenez ; il est compatissant.|ارجعوا؛ إنه رؤوف رحيم.
AMO.5.24|justice|Let justice roll like a river.|Que la justice coule comme un fleuve.|ليجرِ الحق كنهر.
JON.4.2|mercy|God is gracious and merciful.|Dieu est compatissant et miséricordieux.|الله رؤوف ورحيم.
MIC.7.18|forgiveness|He delights in mercy.|Il prend plaisir à la miséricorde.|يُسرّ بالرأفة.
HAB.3.17-18|joy|Rejoice even when the fig tree fails.|Réjouissez-vous même si le figuier ne fleurit pas.|افرح حتى إن لم يزهر التين.
HAB.3.19|strength|He makes your feet sure on the heights.|Il affermit vos pas sur les hauteurs.|يثبّت قدميك على المرتفعات.
ZEC.4.6|spirit|Not by might, but by his Spirit.|Ni par la puissance, mais par son Esprit.|لا بالقدرة بل بروحه.
MAL.3.10|generosity|Generosity opens heaven’s windows.|La générosité ouvre les écluses des cieux.|السخاء يفتح كوى السماء.
MAT.4.4|word|Live by every word from God.|Vivez de toute parole de Dieu.|بكل كلمة من الله تحيا.
MAT.4.19|calling|Follow him, and he will shape you.|Suivez-le ; il vous transformera.|اتبعه فيصنع منك جديدًا.
MAT.5.3|humility|Blessed are the poor in spirit.|Heureux les pauvres en esprit.|طوبى للمساكين بالروح.
MAT.5.4|grief|Those who mourn will be comforted.|Ceux qui pleurent seront consolés.|الحزانى يتعزّون.
MAT.5.8|purity|The pure in heart will see God.|Les cœurs purs verront Dieu.|أنقياء القلب يعاينون الله.
MAT.5.14-16|witness|Let your light shine today.|Que votre lumière brille aujourd’hui.|ليضئ نورك اليوم.
MAT.5.44|love|Pray for those who hurt you.|Priez pour ceux qui vous blessent.|صلِّ لأجل الذين يسيئون إليك.
MAT.6.6|prayer|Pray in secret; God sees.|Priez dans le secret ; Dieu voit.|صلِّ في الخفاء؛ الله يرى.
MAT.6.21|treasure|Your heart follows your treasure.|Votre cœur suit votre trésor.|حيث كنزك هناك قلبك.
MAT.6.26|provision|You are worth more than the birds.|Vous valez plus que les oiseaux.|أنت أفضل من الطيور.
MAT.7.7|prayer|Ask, seek, knock.|Demandez, cherchez, frappez.|اسأل، اطلب، اقرع.
MAT.7.12|kindness|Treat others as you want to be treated.|Faites aux autres ce que vous voudriez qu’on vous fasse.|عامل الناس كما تريد أن يعاملوك.
MAT.7.24|foundation|Build on the rock.|Bâtissez sur le roc.|ابنِ على الصخر.
MAT.9.12-13|mercy|Jesus came for those who need him.|Jésus est venu pour ceux qui ont besoin de lui.|جاء يسوع لمن يحتاجون إليه.
MAT.10.29-31|worth|You are known and valued.|Vous êtes connu et précieux.|أنت معروف وغالٍ.
MAT.14.27|courage|Take heart; he is here.|Rassurez-vous ; il est là.|تشجّع؛ هو هنا.
MAT.16.24|discipleship|Follow him one step at a time.|Suivez-le pas à pas.|اتبعه خطوة بخطوة.
MAT.17.20|faith|Small faith can move mountains.|Une petite foi peut déplacer des montagnes.|إيمان صغير ينقل الجبال.
MAT.18.20|community|Where two or three gather, he is there.|Là où deux ou trois sont réunis, il est là.|حيثما اجتمع اثنان أو ثلاثة فهو هناك.
MAT.19.26|possibility|With God all things are possible.|À Dieu tout est possible.|عند الله كل شيء مستطاع.
MAT.22.37-39|love|Love God; love your neighbour.|Aimez Dieu ; aimez votre prochain.|أحبّ الله وأحبّ قريبك.
MAT.25.40|service|Kindness to the least is kindness to him.|Un geste pour le plus petit, c’est pour lui.|ما تفعله لأصغر الناس تفعله له.
MAT.28.19-20|mission|He is with you always.|Il est avec vous tous les jours.|هو معك كل الأيام.
MRK.1.35|prayer|Find a quiet place to pray.|Trouvez un lieu calme pour prier.|جِد مكانًا هادئًا للصلاة.
MRK.4.39-40|peace|He can calm the storm.|Il peut calmer la tempête.|هو يُسكّت العاصفة.
MRK.5.36|faith|Don’t be afraid; only believe.|Ne crains pas, crois seulement.|لا تخف، آمن فقط.
LUK.18.27|possibility|What is impossible for people is possible with God.|Ce qui est impossible aux hommes est possible à Dieu.|غير المستطاع عند الناس مستطاع عند الله.
JHN.13.14-15|service|Serve one another as he served.|Servez-vous les uns les autres comme il a servi.|اخدموا بعضكم بعضًا كما خدم.
MRK.11.24|prayer|Pray with trust.|Priez avec confiance.|صلِّ بثقة.
LUK.1.37|possibility|Nothing is impossible with God.|Rien n’est impossible à Dieu.|ليس شيء غير ممكن لدى الله.
LUK.1.46-47|praise|My soul magnifies the Lord.|Mon âme exalte le Seigneur.|تعظّم نفسي الرب.
LUK.2.10-11|christmas|Good news of great joy.|Une bonne nouvelle de grande joie.|بشرى بفرح عظيم.
LUK.6.31|kindness|Do to others as you would want.|Faites aux autres comme vous voudriez.|افعل بالناس كما تريد.
LUK.6.36|mercy|Be merciful, as your Father is.|Soyez miséricordieux comme votre Père.|كن رحيمًا كما أبوك رحيم.
LUK.6.38|generosity|Give, and it will be given.|Donnez, et l’on vous donnera.|أعطِ تُعطَ.
LUK.10.41-42|rest|Choose the one thing needed.|Choisissez la seule chose nécessaire.|اختر الحاجة الواحدة.
LUK.11.9|prayer|Keep asking; keep seeking.|Continuez à demander, à chercher.|واصل السؤال والطلب.
LUK.12.7|worth|Even your hairs are numbered.|Même vos cheveux sont comptés.|حتى شعور رأسك محصاة.
LUK.15.7|joy|Heaven rejoices over one who returns.|Le ciel se réjouit d’un seul qui revient.|في السماء فرح بواحد يعود.
LUK.15.20|grace|The Father runs to meet you.|Le Père court à votre rencontre.|الآب يركض لملاقاتك.
LUK.19.10|salvation|He came to seek the lost.|Il est venu chercher ce qui était perdu.|جاء ليطلب الضالّ.
LUK.23.34|forgiveness|Father, forgive them.|Père, pardonne-leur.|يا أبتاه اغفر لهم.
LUK.24.32|word|Let your heart burn with his word.|Que votre cœur brûle de sa parole.|ليلتهب قلبك بكلمته.
JHN.1.5|light|The darkness cannot overcome the light.|Les ténèbres ne l’emportent pas sur la lumière.|الظلمة لا تغلب النور.
JHN.1.12|identity|You can be called a child of God.|Vous pouvez être appelé enfant de Dieu.|يمكنك أن تصير ابنًا لله.
JHN.1.14|christmas|The Word became flesh.|La Parole a été faite chair.|الكلمة صار جسدًا.
JHN.3.17|grace|He came to save, not condemn.|Il est venu sauver, non condamner.|جاء ليُخلّص لا ليدين.
JHN.4.14|thirst|Living water satisfies.|L’eau vive désaltère.|الماء الحي يروي.
JHN.6.35|provision|Jesus is the bread of life.|Jésus est le pain de vie.|يسوع هو خبز الحياة.
JHN.6.37|welcome|Whoever comes will not be turned away.|Celui qui vient ne sera pas rejeté.|من يُقبل إليه لا يُطرد.
JHN.8.12|light|Follow the light of the world.|Suivez la lumière du monde.|اتبع نور العالم.
JHN.8.32|truth|The truth will set you free.|La vérité vous affranchira.|الحق يحرّرك.
JHN.8.36|freedom|Free indeed.|Vraiment libre.|أحرار حقًا.
JHN.10.10|life|He came to give life in abundance.|Il est venu donner la vie en abondance.|جاء ليعطي حياة أفضل.
JHN.10.11|care|The good shepherd lays down his life.|Le bon berger donne sa vie.|الراعي الصالح يبذل نفسه.
JHN.10.27-28|security|No one can snatch you from his hand.|Nul ne vous arrachera de sa main.|لا يخطفك أحد من يده.
JHN.13.34-35|love|Love one another as he loved.|Aimez-vous comme il a aimé.|أحبّوا بعضكم كما أحبّكم.
JHN.14.1-3|hope|Let not your heart be troubled.|Que votre cœur ne se trouble pas.|لا تضطرب قلوبكم.
JHN.14.6|truth|He is the way, the truth, the life.|Il est le chemin, la vérité, la vie.|هو الطريق والحق والحياة.
JHN.14.18|presence|You are not left alone.|Vous n’êtes pas laissés orphelins.|لا يترككم يتامى.
JHN.15.9|love|Remain in his love.|Demeurez dans son amour.|اثبتوا في محبته.
JHN.15.13|love|No greater love than this.|Il n’y a pas de plus grand amour.|ليس حب أعظم من هذا.
JHN.15.15|friendship|You are called his friend.|Vous êtes appelé son ami.|دعاك صديقًا.
JHN.16.33|courage|Take heart; he has overcome.|Courage ; il a vaincu.|ثق، هو قد غلب.
JHN.17.3|knowing|Eternal life is knowing God.|La vie éternelle, c’est connaître Dieu.|الحياة الأبدية أن تعرف الله.
JHN.20.29|faith|Blessed are those who believe unseen.|Heureux ceux qui croient sans avoir vu.|طوبى للذين آمنوا ولم يروا.
JHN.20.31|faith|Written so that you may believe.|Écrit pour que vous croyiez.|كُتب لتؤمنوا.
JHN.21.17|restoration|Jesus restores and sends again.|Jésus restaure et renvoie.|يسوع يردّ ويرسل من جديد.
ACT.1.8|mission|You will receive power.|Vous recevrez une puissance.|ستنالون قوة.
ACT.2.42|community|Devote yourself to fellowship and prayer.|Persévérez dans la communion et la prière.|واظبوا على الشركة والصلاة.
ACT.4.12|salvation|Salvation is found in Jesus.|Le salut se trouve en Jésus.|الخلاص في يسوع.
ACT.16.31|faith|Believe in the Lord Jesus.|Crois au Seigneur Jésus.|آمن بالرب يسوع.
ACT.17.28|presence|In him we live and move.|En lui nous avons la vie et le mouvement.|به نحيا ونتحرك.
ACT.20.35|generosity|It is more blessed to give.|Il y a plus de bonheur à donner.|العطاء مغبوط أكثر من الأخذ.
ROM.1.16|gospel|Unashamed of the good news.|Sans honte de l’Évangile.|لا تستحِ بالإنجيل.
ROM.3.23-24|grace|All need grace; grace is given.|Tous ont besoin de grâce ; elle est donnée.|الكل يحتاج النعمة، وهي مجانية.
ROM.5.1|peace|Peace with God through Jesus.|La paix avec Dieu par Jésus.|سلام مع الله بيسوع.
ROM.5.3-5|perseverance|Hard times can grow hope.|Les épreuves peuvent faire grandir l’espérance.|الضيق قد ينشئ رجاء.
ROM.5.8|love|Loved while still far away.|Aimé quand vous étiez encore loin.|أحبّنا ونحن بعد بعيدون.
ROM.6.23|gift|Eternal life is a gift.|La vie éternelle est un don.|الحياة الأبدية هبة.
ROM.8.1|freedom|No condemnation in Christ.|Aucune condamnation en Christ.|لا دينونة في المسيح.
ROM.8.18|hope|Present pain, future glory.|Souffrance présente, gloire à venir.|آلام الآن ومجد آتٍ.
ROM.8.26|prayer|The Spirit helps when words fail.|L’Esprit aide quand les mots manquent.|الروح يعين حين تعجز الكلمات.
ROM.8.28|providence|God works all things for good.|Dieu fait concourir toutes choses au bien.|كل الأشياء تعمل معًا للخير.
ROM.8.31|assurance|If God is for us, who can be against us?|Si Dieu est pour nous, qui sera contre nous ?|إن كان الله معنا فمن علينا؟
ROM.10.9|faith|Confess and believe.|Confessez et croyez.|اعترف وآمن.
ROM.10.17|faith|Faith grows by hearing.|La foi vient de ce qu’on entend.|الإيمان بالخبر.
ROM.12.1|worship|Offer your everyday life.|Offrez votre vie de chaque jour.|قدّم حياتك اليومية.
ROM.12.10|love|Outdo one another in honour.|Rivalisez d’honneur les uns envers les autres.|قدّموا بعضكم بعضًا في الكرامة.
ROM.12.12|patience|Joyful in hope, patient, prayerful.|Joyeux dans l’espérance, patients, fidèles à la prière.|فرحين في الرجاء، صابرين، مواظبين على الصلاة.
ROM.12.18|peace|As far as it depends on you, live at peace.|Autant que cela dépend de vous, vivez en paix.|سالموا جميع الناس قدر طاقتكم.
ROM.12.21|goodness|Overcome evil with good.|Surmontez le mal par le bien.|اغلب الشر بالخير.
ROM.13.10|love|Love does no harm.|L’amour ne fait pas de mal.|المحبة لا تصنع شرًا.
ROM.12.15|compassion|Rejoice and weep with others.|Réjouissez-vous et pleurez avec les autres.|افرحوا مع الفرحين وابكوا مع الباكين.
ROM.15.7|welcome|Welcome one another.|Accueillez-vous les uns les autres.|اقبلوا بعضكم بعضًا.
1CO.1.27|weakness|God uses the weak.|Dieu choisit ce qui est faible.|اختار الله ضعفاء العالم.
1CO.2.9|hope|What God has prepared is beyond imagining.|Ce que Dieu a préparé dépasse l’imagination.|ما أعدّه الله يفوق التصوّر.
1CO.10.13|temptation|There is a way through.|Il y a une issue.|هناك منفذ.
1CO.10.31|work|Do everything for God’s glory.|Faites tout pour la gloire de Dieu.|افعلوا كل شيء لمجد الله.
1CO.13.13|love|The greatest is love.|La plus grande est l’amour.|أعظمهن المحبة.
1CO.15.57|victory|Thanks be to God for the victory.|Grâces à Dieu pour la victoire.|شكرًا لله الذي يعطينا الغلبة.
1CO.15.58|perseverance|Your work is not in vain.|Votre travail n’est pas vain.|تعبكم ليس باطلًا.
1CO.16.13-14|courage|Be strong; do everything in love.|Soyez forts ; faites tout avec amour.|تقوّوا؛ ولتكن كل أموركم في محبة.
2CO.1.3-4|comfort|Comforted to comfort others.|Consolé pour consoler.|تعزّيت لتعزّي غيرك.
2CO.4.16-17|renewal|Renewed day by day.|Renouvelé de jour en jour.|يتجدّد يومًا فيومًا.
2CO.4.18|hope|Look at what is unseen.|Regardez aux choses invisibles.|انظر إلى ما لا يُرى.
2CO.5.7|faith|Walk by faith.|Marchez par la foi.|بالإيمان نسلك.
2CO.5.17|newness|In Christ, a new creation.|En Christ, une nouvelle création.|في المسيح خليقة جديدة.
2CO.9.7|generosity|God loves a cheerful giver.|Dieu aime celui qui donne avec joie.|المعطي المسرور يحبه الله.
2CO.9.8|provision|Grace enough for every good work.|Assez de grâce pour toute bonne œuvre.|نعمة كافية لكل عمل صالح.
GAL.2.20|identity|Christ lives in me.|Christ vit en moi.|المسيح يحيا فيّ.
GAL.5.1|freedom|Stand firm in freedom.|Demeurez fermes dans la liberté.|اثبتوا في الحرية.
GAL.5.13|service|Use freedom to serve in love.|Servez-vous les uns les autres par amour.|اخدموا بعضكم بعضًا بالمحبة.
GAL.6.2|burden|Carry each other’s burdens.|Portez les fardeaux les uns des autres.|احملوا بعضكم أثقال بعض.
EPH.1.7|forgiveness|Redeemed and forgiven by grace.|Racheté et pardonné par grâce.|فداء وغفران بالنعمة.
EPH.2.10|purpose|You are God’s workmanship.|Vous êtes l’ouvrage de Dieu.|أنت صنعة الله.
EPH.3.17-19|love|Rooted in love.|Enraciné dans l’amour.|متأصّل في المحبة.
EPH.3.20|power|More than you can ask or imagine.|Plus que vous ne pouvez demander ou penser.|أكثر مما تطلب أو تفتكر.
EPH.4.2-3|unity|Bear with one another in love.|Supportez-vous les uns les autres avec amour.|احتملوا بعضكم بعضًا في المحبة.
EPH.4.26|anger|Don’t let the sun set on your anger.|Que le soleil ne se couche pas sur votre colère.|لا تغرب الشمس على غضبك.
EPH.4.29|words|Let your words build up.|Que vos paroles édifient.|لتكن كلماتك للبنيان.
EPH.5.2|love|Walk in love.|Marchez dans l’amour.|اسلكوا في المحبة.
EPH.6.10|strength|Be strong in the Lord.|Fortifiez-vous dans le Seigneur.|تقوّوا في الرب.
PHP.1.6|perseverance|He will finish what he began.|Il achèvera ce qu’il a commencé.|الذي ابتدأ يكمّل.
PHP.2.3-4|humility|Value others above yourself.|Estimez les autres supérieurs à vous-même.|حاسبين الآخرين أفضل من أنفسكم.
PHP.2.13|purpose|God is at work in you.|Dieu agit en vous.|الله العامل فيكم.
PHP.3.13-14|perseverance|Press on toward the goal.|Courez vers le but.|اسعَ نحو الهدف.
PHP.4.4|joy|Rejoice in the Lord always.|Réjouissez-vous toujours dans le Seigneur.|افرحوا في الرب كل حين.
PHP.4.8|thoughts|Think about what is lovely.|Pensez à ce qui est aimable.|فكّروا فيما هو جميل.
PHP.4.11-12|contentment|Contentment can be learned.|Le contentement s’apprend.|القناعة تُتعلَّم.
PHP.4.13|strength|Strength for all things through Christ.|Je puis tout par celui qui me fortifie.|أستطيع كل شيء في المسيح.
PHP.4.19|provision|God will supply every need.|Dieu pourvoira à tous vos besoins.|يملأ إلهي كل احتياجكم.
COL.1.17|creation|In him all things hold together.|Tout subsiste en lui.|فيه يقوم الكل.
COL.2.6-7|growth|Rooted and overflowing with thanks.|Enracinés et abondant en actions de grâces.|متأصّلين وفائضين بالشكر.
COL.3.2|focus|Set your mind on things above.|Pensez aux choses d’en haut.|اهتموا بما فوق.
COL.3.15|peace|Let Christ’s peace rule your heart.|Que la paix de Christ règne dans votre cœur.|ليملك سلام المسيح في قلوبكم.
COL.3.23|work|Work wholeheartedly, as for the Lord.|Travaillez de bon cœur, pour le Seigneur.|اعملوا من القلب كما للرب.
COL.4.6|words|Let your speech be gracious.|Que votre parole soit toujours aimable.|ليكن كلامكم بنعمة.
1TH.4.11|quiet|Aim for a quiet life.|Cherchez à vivre paisiblement.|احرصوا أن تكونوا هادئين.
1TH.5.11|encouragement|Encourage one another.|Encouragez-vous mutuellement.|عزّوا بعضكم بعضًا.
2TH.3.16|peace|Peace at all times, in every way.|La paix en tout temps et de toute manière.|سلام دائمًا من كل وجه.
1TI.1.15|grace|Christ came to save sinners.|Christ est venu sauver les pécheurs.|المسيح جاء ليخلّص الخطاة.
1TI.4.12|example|Set an example, whatever your age.|Soyez un modèle, quel que soit votre âge.|كن قدوة مهما كان عمرك.
1TI.2.1|prayer|Pray for everyone.|Priez pour tous les hommes.|صلّوا لأجل جميع الناس.
2TI.1.7|courage|Not a spirit of fear.|Pas un esprit de timidité.|ليس روح الخوف.
2TI.3.16-17|word|All Scripture is breathed by God.|Toute Écriture est inspirée de Dieu.|كل الكتاب موحى به من الله.
2TI.4.7|perseverance|Keep the faith to the end.|Gardez la foi jusqu’au bout.|حافظ على الإيمان حتى النهاية.
TIT.3.4-5|grace|Saved by his mercy.|Sauvé par sa miséricorde.|خلّصنا برحمته.
PHM.1.7|encouragement|Your love refreshes others.|Votre amour réconforte les autres.|محبتك تريح الآخرين.
HEB.10.23|hope|Hold fast; he is faithful.|Retenez fermement ; il est fidèle.|تمسّكوا؛ هو أمين.
HEB.10.24-25|community|Spur one another on.|Stimulez-vous les uns les autres.|لنحرّض بعضنا بعضًا على الخير.
HEB.12.1-2|perseverance|Run with your eyes on Jesus.|Courez les regards fixés sur Jésus.|اركض ناظرًا إلى يسوع.
HEB.12.11|discipline|Discipline yields peace later.|La discipline produit plus tard la paix.|التأديب يثمر سلامًا لاحقًا.
HEB.13.2|hospitality|Show hospitality to strangers.|Exercez l’hospitalité.|لا تنسوا إضافة الغرباء.
HEB.13.5|contentment|He will never leave you.|Il ne vous délaissera jamais.|لن يتركك أبدًا.
HEB.13.8|faithfulness|Jesus is the same forever.|Jésus est le même éternellement.|يسوع هو هو أمسًا واليوم وإلى الأبد.
JAS.1.2-3|trials|Trials can grow endurance.|Les épreuves produisent la patience.|التجارب تنشئ صبرًا.
JAS.1.17|gift|Every good gift is from above.|Tout don parfait vient d’en haut.|كل عطية صالحة من فوق.
JAS.1.19|listening|Quick to listen, slow to speak.|Prompt à écouter, lent à parler.|مسرعًا في الاستماع مبطئًا في التكلم.
JAS.1.22|obedience|Do what the word says.|Mettez la parole en pratique.|كونوا عاملين بالكلمة.
JAS.4.8|nearness|Draw near; he draws near.|Approchez-vous ; il s’approchera.|اقتربوا فيقترب.
JAS.5.16|prayer|Pray for each other.|Priez les uns pour les autres.|صلّوا بعضكم لأجل بعض.
1PE.1.3|hope|A living hope.|Une espérance vivante.|رجاء حي.
1PE.2.9|identity|Chosen, and called into his light.|Choisi, et appelé à sa lumière.|مختار ومدعو إلى نوره.
1PE.3.15|witness|Be ready to share your hope.|Soyez prêt à parler de votre espérance.|كن مستعدًا لتشارك رجاءك.
1PE.4.8|love|Love covers many faults.|L’amour couvre une multitude de fautes.|المحبة تستر كثرة من الخطايا.
1PE.4.10|gifts|Use your gift to serve others.|Mettez votre don au service des autres.|ليخدم كل واحد بموهبته.
1PE.5.10|restoration|After suffering, he restores.|Après la souffrance, il rétablit.|بعد الألم يردّك ويثبّتك.
2PE.3.9|patience|God is patient.|Dieu est patient.|الله يتأنّى.
2PE.3.18|growth|Grow in grace and knowledge.|Croissez dans la grâce et la connaissance.|انموا في النعمة والمعرفة.
1JN.3.1|identity|See how much the Father loves you.|Voyez quel amour le Père vous a donné.|انظروا أية محبة أعطانا الآب.
1JN.3.18|love|Love in action and truth.|Aimez en actes et en vérité.|لنحب بالعمل والحق.
1JN.4.7|love|Love comes from God.|L’amour vient de Dieu.|المحبة هي من الله.
1JN.4.10|love|This is love: he loved first.|Voici l’amour : il nous a aimés le premier.|هذه هي المحبة: هو أحبّنا أولًا.
1JN.4.16|love|God is love.|Dieu est amour.|الله محبة.
1JN.4.18|fear|Perfect love drives out fear.|L’amour parfait bannit la crainte.|المحبة الكاملة تطرح الخوف.
1JN.4.19|love|We love because he first loved us.|Nous aimons parce qu’il nous a aimés le premier.|نحن نحبه لأنه هو أحبنا أولًا.
1JN.5.14|prayer|He hears us.|Il nous écoute.|إنه يسمع لنا.
1TH.5.24|faithfulness|He who calls you is faithful.|Celui qui vous appelle est fidèle.|أمين هو الذي يدعوكم.
JUD.1.24-25|praise|He is able to keep you from stumbling.|Il peut vous préserver de toute chute.|هو القادر أن يحفظك من العثرة.
REV.3.20|welcome|He stands at the door and knocks.|Il se tient à la porte et frappe.|هو واقف على الباب ويقرع.
REV.21.4|hope|He will wipe away every tear.|Il essuiera toute larme.|سيمسح كل دمعة.
REV.21.5|newness|He makes all things new.|Il fait toutes choses nouvelles.|هو يصنع كل شيء جديدًا.
REV.22.20|hope|Come, Lord Jesus.|Viens, Seigneur Jésus.|تعال أيها الرب يسوع.
GEN.15.6|faith|Trust was counted as righteousness.|Sa foi lui fut comptée comme justice.|حُسب الإيمان برًا.
GEN.18.14|possibility|Is anything too hard for God?|Y a-t-il rien de trop difficile pour Dieu ?|هل يستحيل على الرب شيء؟
NUM.23.19|faithfulness|God keeps his word.|Dieu tient parole.|الله يفي بكلمته.
DEU.30.19|choice|Choose life.|Choisis la vie.|اختر الحياة.
2KI.6.16|courage|Those with us are more.|Ceux qui sont avec nous sont plus nombreux.|الذين معنا أكثر.
1SA.12.24|gratitude|Remember the great things he has done.|Souvenez-vous de ses grandes œuvres.|تذكّر ما صنعه من عظائم.
2CH.20.15|battle|The battle is God’s.|La bataille est à Dieu.|الحرب لله.
NEH.9.17|forgiveness|A God ready to pardon.|Un Dieu prêt à pardonner.|إله غفور.
PSA.18.2|refuge|My rock, my fortress.|Mon rocher, ma forteresse.|صخرتي وحصني.
PSA.23.4|courage|Even in the dark valley, he is with you.|Même dans la vallée sombre, il est là.|حتى في الوادي المظلم هو معك.
PSA.27.14|waiting|Wait for the Lord; be strong.|Espère en l’Éternel ; fortifie-toi.|انتظر الرب، تشدّد.
PSA.28.7|trust|My heart trusts and is helped.|Mon cœur se confie et je suis secouru.|عليه اتّكل قلبي فنلت العون.
PSA.29.11|peace|He blesses his people with peace.|Il bénit son peuple par la paix.|يبارك شعبه بالسلام.
PSA.36.5|faithfulness|His love reaches to the heavens.|Sa bonté atteint les cieux.|رحمته إلى السماوات.
PSA.37.7|patience|Be still and wait patiently.|Garde le silence et espère en lui.|انتظر الرب واصبر له.
PSA.46.10|stillness|Be still, and know that he is God.|Arrêtez, et sachez qu’il est Dieu.|كفّوا واعلموا أنه هو الله.
PSA.61.2|refuge|Lead me to the rock higher than I.|Conduis-moi sur le rocher trop élevé pour moi.|إلى صخرة أرفع مني اهدني.
PSA.68.19|care|He bears our burdens daily.|Il porte nos fardeaux chaque jour.|يحمل أثقالنا كل يوم.
PSA.71.14|hope|I will hope continually.|J’espérerai toujours.|أرجو دائمًا.
PSA.94.19|comfort|His comfort delights the anxious soul.|Ses consolations réjouissent l’âme inquiète.|تعزياته تلذّذ النفس القلقة.
PSA.116.1-2|prayer|He bends down to listen.|Il penche son oreille vers moi.|أمال أذنه إليّ.
PSA.138.8|purpose|He will fulfil his purpose for you.|Il achèvera ce qui vous concerne.|الرب يكمّل ما يخصّك.
PSA.139.23-24|honesty|Search me and know my heart.|Sonde-moi et connais mon cœur.|اختبرني واعرف قلبي.
PSA.145.8-9|grace|Gracious, merciful, slow to anger.|Miséricordieux et lent à la colère.|الرب حنّان ورحيم بطيء الغضب.
PRO.11.25|generosity|Refresh others and you will be refreshed.|Celui qui arrose sera lui-même arrosé.|المُروي هو أيضًا يُروى.
PRO.12.25|encouragement|A kind word lifts the heart.|Une bonne parole réjouit le cœur.|الكلمة الطيبة تفرّح القلب.
PRO.14.30|peace|A tranquil heart gives life.|Un cœur calme est la vie du corps.|القلب الهادئ حياة الجسد.
PRO.22.6|family|Teach a child the way to go.|Instruis l’enfant selon la voie à suivre.|ربِّ الولد في طريقه.
ISA.6.8|calling|Here I am; send me.|Me voici, envoie-moi.|هأنذا أرسلني.
ISA.46.4|care|He will carry you into old age.|Il vous portera jusqu’à la vieillesse.|إلى الشيخوخة هو يحملك.
LAM.3.25|waiting|The Lord is good to those who wait.|L’Éternel est bon pour qui espère en lui.|طيّب هو الرب للذين يترجّونه.`;
