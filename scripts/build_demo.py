"""
Build the new demo section HTML for lascd.html using real data from 百年孤独.MD.
This script reads lascd.html, replaces the demo section, and writes it back.
"""
import json
import os
import re

# ── All real data from 百年孤独.MD ──

data = {
    'wcs': 122.18,
    'tier': '不朽丰碑',
    'percentile': 81,
    'nickname': '「魔幻史诗的完型者」',
    'one_liner': '「以预言为骨架，以孤独为血脉，在循环的时间中建起一座语言的巴别塔」',
    'literary_echo': '天地不仁，以万物为刍狗',
    'literary_echo_source': '老子《道德经》',
    'tags': ['魔幻现实主义', '家族史诗', '循环时间', '拉美文学爆炸', '悲剧宿命', '权力与孤独', '神话叙事'],
    'overview': (
        '马孔多——一个被加勒比海的热雾与丛林的阴影所笼罩的小镇——的诞生与毁灭。'
        '何塞·阿尔卡蒂奥·布恩迪亚与表妹乌尔苏拉结婚，因惧怕生出猪尾巴的孩子而逃离家乡，创建了马孔多。'
        '这是一个关于布恩迪亚家族七代人命运的宏大叙事。第一代人何塞·阿尔卡蒂奥·布恩迪亚沉迷于吉卜赛人'
        '梅尔基亚德斯带来的科学发明与炼金术，最终精神失常被捆在栗树下。第二代的奥雷里亚诺·布恩迪亚上校'
        '发动了三十二次武装起义，在权力的巅峰上陷入冰冷的孤独；而兄长何塞·阿尔卡蒂奥的欲望与死亡留下了'
        '无法填补的缺口。第三代阿尔卡蒂奥的暴政，第四代美人雷梅黛丝的升天，第五代何塞·阿尔卡蒂奥的荒淫，'
        '第六代奥雷里亚诺与姑母乱伦生下第七代——长着猪尾巴的孩子，被蚂蚁吃掉——梅尔基亚德斯的羊皮卷被'
        '最终破译，飓风将马孔多从大地上抹去，仿佛一切从未发生。小说交织着真实与魔幻：飞毯掠过头顶，死者'
        '与活人同桌交谈，鲜血自动蜿蜒流回母亲脚下，俏姑娘抓着床单升天，黄色蝴蝶始终盘旋在巴比洛尼亚身边。'
        '这些超现实事件以讲述日常琐事的口吻被叙述，仿佛魔幻本就是现实的一部分。'
    ),
    'golden_quote': (
        '多年以后，面对行刑队，奥雷里亚诺·布恩迪亚上校将会回想起父亲带他去见识冰块的那个遥远的下午。'
    ),
    'layer_avgs': {'A': 118.50, 'B': 118.25, 'C': 124.00, 'D': 129.25},
    'best_dim': {
        'name': '风格独创性', 'score': 132.0,
        'reason': (
            '百年孤独的风格不可复制，直接定义魔幻现实主义，其"魔幻即现实"的美学立场'
            '已成为世界文学史上最重要的范式革命之一，与《堂吉诃德》同为风格原点，达到永恒殿堂级132分。'
        )
    },
    'worst_dim': {
        'name': '人物塑造', 'score': 112.0,
        'reason': (
            '七代人共用奥雷里亚诺与阿尔卡蒂奥两个名字造成辨识度障碍，批评史上常指出的'
            '"名字混乱"在局部削弱了人物个体的可区分性与情感代入的便利性。'
        )
    },
    'dims': [
        {'id':1,'name':'语言艺术性','weight':'6.25%','score':118,'tier':'不朽丰碑','benchmark':'《佩德罗·巴拉莫》','layer':'A','evidence':'"多年以后，面对行刑队……"——这一句在单一复句中完成了三种时间的折叠；"世界新生伊始，许多事物还没有名字"——神话式的简朴语言赋予叙述以创世记般的原初质感。','compare':'抵达魔幻现实主义语言艺术的巅峰水准，在诗意铺陈与叙事效率之间达到罕见平衡。','gapLevel':'接近'},
        {'id':2,'name':'修辞运用','weight':'6.25%','score':116,'tier':'不朽丰碑','benchmark':'《佩德罗·巴拉莫》','layer':'A','evidence':'俏姑娘雷梅黛丝抓着床单升天——魔幻修辞的巅峰，超自然事件以日常口吻叙述，达到"魔幻即现实"的美学效果；黄色蝴蝶的意象贯穿全书，从具体的视觉符号升华为命运的隐喻。','compare':'魔幻现实主义修辞体系的定义性实践，将神话隐喻、超现实意象与日常叙事无缝焊接。','gapLevel':'接近'},
        {'id':3,'name':'结构设计','weight':'6.25%','score':122,'tier':'不朽丰碑','benchmark':'《阿莱夫》','layer':'A','evidence':'全书以梅尔基亚德斯的羊皮卷预言为骨架，结尾处羊皮卷被破译的同时世界走向终结——首尾咬合的环形结构；七代人在同一个名字的循环中展开，人物的命运重复形成结构的螺旋。','compare':'长篇叙事结构设计的典范，环形时间与循环命运的互文结构具有极高的形式完成度。','gapLevel':'接近'},
        {'id':4,'name':'文体适配','weight':'6.25%','score':118,'tier':'不朽丰碑','benchmark':'《玉米人》','layer':'A','evidence':'神话叙事与19世纪拉美史实无缝融合——鬼魂与活人同桌吃饭、神父漂浮在巧克力上，文体层面不区分"现实"与"非现实"；圣经文体与19世纪编年史文体的交替使用。','compare':'魔幻现实主义的文体完型者，将神话思维植入现代叙事的文体革命已臻化境。','gapLevel':'超越'},
        {'id':5,'name':'叙事技巧','weight':'10.0%','score':128,'tier':'永恒殿堂','benchmark':'《喧哗与骚动》','layer':'B','evidence':'"多年以后，面对行刑队……"——预叙手法在全书被反复使用，创造了一种"未来已在过去中被预见"的宿命感叙事基调；结尾处奥雷里亚诺破译羊皮卷的同时飓风摧毁马孔多——叙述时间与故事时间在最后一刻合拢。','compare':'叙事时间技术已抵达现代主义叙事的最高水平，预叙手法的系统化运用在小说史上具有开创性。','gapLevel':'接近'},
        {'id':6,'name':'人物塑造','weight':'10.0%','score':112,'tier':'传世经典','benchmark':'《佩德罗·巴拉莫》','layer':'B','evidence':'奥雷里亚诺·布恩迪亚上校的塑造——从理想主义的革命者到冷漠的独裁者，最后在反复炼制小金鱼中归于虚无，完成了一个完整的命运弧线；阿玛兰妲·乌尔苏拉与奥雷里亚诺的乱伦之爱——人物既是独立的个体，也是家族宿命的重复载体。','compare':'核心人物（上校、乌尔苏拉、俏姑娘）达到传世经典水准，但次要人物因姓名制度和大规模群像构图而存在辨识度短板。','gapLevel':'一定差距'},
        {'id':7,'name':'情节架构','weight':'10.0%','score':118,'tier':'不朽丰碑','benchmark':'《红楼梦》','layer':'B','evidence':'马孔多的创建、繁荣、狂热、衰落、毁灭，构成一个有机的生命周期，每一阶段都有不可替代的事件群支撑；香蕉公司罢工及其血腥镇压事件——小说中唯一明确锚定历史事实（1928年哥伦比亚香蕉种植园大罢工）的情节，将魔幻叙事拉回历史现场。','compare':'宏伟的情节架构在总体性上达到了不朽丰碑的高度，但部分中间段落的叙事驱动力不及首尾。','gapLevel':'一定差距'},
        {'id':8,'name':'细节密度','weight':'5.0%','score':115,'tier':'不朽丰碑','benchmark':'《佩德罗·巴拉莫》','layer':'B','evidence':'奥雷里亚诺上校晚年反复制作又熔化小金鱼的细节——熔金的气味、锤击的声音、鱼眼的冷光承载了孤独、虚无与时间循环的全部主题；冰块——"摸起来像地狱里的东西"，这一贯穿始终的意象细节同时承载了"陌生""惊奇""记忆"与"命运预告"。','compare':'感官细节具有高度的意象浓缩力与主题承载密度，细节从不冗余。','gapLevel':'接近'},
        {'id':9,'name':'主题深度','weight':'8.33%','score':130,'tier':'永恒殿堂','benchmark':'《红楼梦》','layer':'C','evidence':'"家族的第一个人被捆在树上，最后一个人被蚂蚁吃掉"——这一预言统摄了全书的历史循环观，探讨文明兴衰的内在规律；奥雷里亚诺上校的"孤独"不仅是个人情感状态，更是权力的本质——"权力带来的孤独是真正的孤独"。','compare':'孤独主题的深度已抵达人类存在的基本命题，在个体孤独、家族命运、民族历史与人类循环四个层面同时展开。','gapLevel':'接近'},
        {'id':10,'name':'情感力量','weight':'8.33%','score':114,'tier':'不朽丰碑','benchmark':'《红楼梦》','layer':'C','evidence':'阿玛兰妲在爱情与恐惧之间的终身挣扎——她爱过却不敢接受，最终在织寿衣中等待死亡，这一段具有古希腊悲剧式的命运必然性；梅梅·布恩迪亚与巴比洛尼亚的悲剧爱情——被母亲强行拆散后，梅梅终身不再说话。','compare':'悲剧情感的力量主要来源于命运的结构性压迫感，而非人物心理的细腻渲染，在悲剧崇高性上达到经典高度。','gapLevel':'一定差距'},
        {'id':11,'name':'象征体系','weight':'4.17%','score':122,'tier':'不朽丰碑','benchmark':'《阿莱夫》','layer':'C','evidence':'黄色蝴蝶——作为欲望与厄运的双重象征，从具体物象上升为命运的视觉标记，贯穿巴比洛尼亚与梅梅的悲剧；炼金术——从最初何塞·阿尔卡蒂奥·布恩迪亚的炼金实验到结尾羊皮卷的破译，作为"转化/寻找真理"的象征系统贯穿全书。','compare':'象征系统的高度有机性——每个象征都不是孤立的装饰，而是叙事结构与主题网络的有机节点。','gapLevel':'接近'},
        {'id':12,'name':'时代价值','weight':'4.17%','score':130,'tier':'永恒殿堂','benchmark':'《红楼梦》','layer':'C','evidence':'香蕉公司罢工事件直接影射1928年哥伦比亚政府屠杀罢工工人的历史事件，使魔幻叙事成为政治批判的武器；奥雷里亚诺上校十七次起义的经历，浓缩了拉美独立后百年动荡的军事独裁史。','compare':'作为拉美历史的寓言化表达，在时代诊断的精准性与历史视野的宏阔性上达到了永恒殿堂级。','gapLevel':'接近'},
        {'id':13,'name':'风格独创性','weight':'5.0%','score':132,'tier':'永恒殿堂','benchmark':'《堂吉诃德》','layer':'D','evidence':'魔幻现实主义风格本身即为《百年孤独》所完型，影响了无数后世作家（从中国寻根文学到印度英语小说）；"魔幻即现实"的美学立场——不是用魔幻来逃避现实，而是用魔幻来揭示现实的另一维度，这一创作论具有范式革命的意义。','compare':'在世界文学史上定义了魔幻现实主义这一风格范式，风格独创性已进入永恒殿堂级。','gapLevel':'接近'},
        {'id':14,'name':'审美统一','weight':'5.0%','score':118,'tier':'不朽丰碑','benchmark':'《玉米人》','layer':'D','evidence':'全书始终保持"魔幻是日常"的叙述口吻，飞毯、升天、鬼魂从未被标记为"异常"，审美调性高度一致；从开篇的创世记式语言到结尾的启示录式毁灭，语调的控制如交响乐般精确。','compare':'魔幻与现实在审美层面的融合已臻于完美。','gapLevel':'超越'},
        {'id':15,'name':'文学影响','weight':'2.5%','score':135,'tier':'永恒殿堂','benchmark':'《堂吉诃德》','layer':'D','evidence':'定义了魔幻现实主义这一20世纪最重要的文学流派之一，影响了拉美文学爆炸乃至全球后现代文学；中国作家莫言、韩少功、扎西达娃等均公开承认受其直接影响，催生了中国的"寻根文学"和魔幻叙事实践。','compare':'跨文明传播级别的文学影响，定义了20世纪下半叶世界文学的一个重要方向。','gapLevel':'一定差距'},
        {'id':16,'name':'经典地位','weight':'2.5%','score':132,'tier':'永恒殿堂','benchmark':'《堂吉诃德》','layer':'D','evidence':'诺贝尔文学奖（1982年）、被翻译成超过40种语言、全球销量超过5000万册；在世界文学课程中，已从"拉美文学的杰出代表"上升为"世界文学史上最重要的十部小说之一"的共识地位。','compare':'经典地位高度稳固，从诺奖获奖时的"拉美文学代表"已上升为公认的世界文学核心经典。','gapLevel':'一定差距'},
    ],
    'benchmarks': [
        {'layer':'A','color':'#8b0000','work':'《佩德罗·巴拉莫》','dim':'1.语言艺术性','tier':'不朽丰碑','reason':'同为魔幻现实主义源头，马尔克斯承认"读到鲁尔福之后才知道小说可以这样写"。鲁尔福以冷峻、精准、诗意的简洁语言在梦境与现实间架桥，与《百年孤独》的铺陈华丽各为巅峰，同属不朽丰碑档。'},
        {'layer':'B','color':'#2d6a4f','work':'《喧哗与骚动》','dim':'5.叙事技巧','tier':'不朽丰碑','reason':'福克纳以四个叙述者的意识流碎片拼贴家族崩溃全景，马尔克斯将其时间碎片化技术转化为更系统的预叙手法——"多年以后"句式不仅是修辞装置，更是世界观的语法表达，同属不朽丰碑档。'},
        {'layer':'C','color':'#b8860b','work':'《红楼梦》','dim':'9.主题深度','tier':'不朽丰碑','reason':'两者都以家族盛衰为骨架，《红楼梦》的"色空"观与《百年孤独》的"循环史观"在哲学深处相望。在家族史诗的叙事传统中构成跨文化对话，同属不朽丰碑档。'},
        {'layer':'D','color':'#1a1a1a','work':'《堂吉诃德》','dim':'13.风格独创性','tier':'不朽丰碑','reason':'塞万提斯的风格革命作为现代小说的原型，与《百年孤独》定义魔幻现实主义同属"文类定义者"级别，均为世界文学史上以一部作品开创范式的不朽标杆。'},
    ],
    'deep_sections': [
        {'emoji':'📖','title':'文学坐标与谱系定位','text': (
            '《百年孤独》在文学史上的位置，恰似一座分水岭：它既是拉美文学爆炸的巅峰，也是魔幻现实主义'
            '这一流派在世界范围内获得命名与合法性的关键文本。在谱系上游，它接入胡安·鲁尔福《佩德罗·巴拉莫》'
            '（1955年）的生死交融之境——马尔克斯曾承认，读到鲁尔福之后才知道"小说可以这样写"；接入'
            '米格尔·阿斯图里亚斯《玉米人》（1949年）将玛雅神话思维植入叙事的实验；并溯流而上接到博尔赫斯'
            '《阿莱夫》的形而上寓言传统——博尔赫斯教会了一代拉美作家如何将智性游戏升华为文学。在时间技术上，'
            '它与福克纳的约克纳帕塔法世系（《喧哗与骚动》《我弥留之际》）构成了跨文化对话，马尔克斯将'
            '福克纳的时间碎片化与主观时间观转化为一种更系统的预叙技术——"多年以后"句式不仅是一个修辞装置，'
            '更是一种世界观的语法表达：对未来已被命定的宿命感的捕捉。在主题谱系上，它可与《红楼梦》形成参照：'
            '两者都以一个家族的盛衰为骨架，《红楼梦》的"色空"观与《百年孤独》的"循环史观"在哲学深处相望，'
            '只是《百年孤独》缺少《红楼梦》那种日常生活的绵密质感与情感渗透力，却在历史寓言的寓言性上走得更远'
            '——马孔多不仅是家族，更是拉美大陆的缩影。它的历史坐标：1967年出版，古巴革命后拉美左翼思潮高涨的'
            '年代，冷战格局下的第三世界文化觉醒期。它不是一部政治小说，却比任何政治小说都更深刻地书写了拉美'
            '历史的核心矛盾——独裁、反抗、遗忘。'
        )},
        {'emoji':'✍️','title':'创作背景分析','text': (
            '《百年孤独》创作于加西亚·马尔克斯的创作成熟期（他当时约40岁），此前他已出版了《枯枝败叶》'
            '（1955年）、《恶时辰》（1962年）和《族长的秋天》（1968年出版，但创作几乎同期）。这部作品经历了'
            '长达十五年的构思与十八个月的疯狂写作，写作期间马尔克斯背负了巨额债务，他的妻子梅尔塞德斯负责维持'
            '家计，当小说完成并寄往出版社时，家中已无钱支付邮费——梅尔塞德斯典当了最后的首饰。这部作品的诞生'
            '本身就是一个关于执念与信念的故事。1967年出版后在拉美和欧洲引起轰动，获得诺贝尔文学奖（1982年），'
            '成为拉美文学爆炸的标志性作品，深刻影响了20世纪下半叶的世界文学走向。'
        )},
        {'emoji':'💡','title':'核心贡献与创新分析','text': (
            '《百年孤独》的核心贡献在于完成了魔幻现实主义的文体定型。它不是第一个使用神话框架讲述拉美现实的'
            '作品——鲁尔福和阿斯图里亚斯走得更早——但它是第一个将这一文体打磨至圆熟、系统、可复制的"完型者"。'
            '其创新集中在叙事技巧层面的双重突破：其一，预叙（prolepsis）的系统化使用——"多年以后"句式不仅是'
            '一个叙事花招，而是将整个故事设定为"已在羊皮卷中被书写完毕的命运"，从而在叙事结构层面赋予了文本'
            '一种预言性的威严；其二，魔幻与现实的叙述语调不分化——在飞毯与冰块、鬼魂与总统之间，叙述从不使用'
            '任何"特殊标记"来区分，始终保持一种"记录事实"的口吻，这种语调的一致性正是魔幻现实主义的核心美学'
            '原则：魔幻不是对现实的逃避，而是对现实的更深层揭示。在主题层面，它以"孤独"为核心命题展开了多声部'
            '的变奏：个人之孤独（上校在小金鱼作坊中的自我囚禁），家族之孤独（阿玛兰妲在织寿衣中等待死亡），'
            '历史之孤独（马孔多被现代社会遗忘后又遗忘自身），文明之孤独（拉美大陆在世界历史进程中既被裹挟又被'
            '抛弃）。这一主题的深度与普世性是它跨越文化壁垒的根本原因。'
        )},
        {'emoji':'⚡','title':'张力、开放性与阐释空间','text': (
            '《百年孤独》最深刻的张力存在于"预言"与"自由意志"之间。整个故事自始至终被梅尔基亚德斯的羊皮卷'
            '所笼罩——一切命运都已写就，上校的三十二次起义、阿玛兰妲的拒绝、乱伦之爱的发生，都是预言中已注定'
            '的事件。然而，小说中的每个人物都在奋力挣扎：乌尔苏拉试图通过家族治理打破宿命，上校试图通过革命改变'
            '社会，阿玛兰妲试图通过拒绝爱来逃避伤害——他们都不知道自己正在执行预言。这种"以为自己自由却已被'
            '命定"的悲剧张力，是小说最强大的美学引擎。另一重张力存在于"魔幻"与"历史"之间。马孔多的香蕉公司'
            '罢工直接对应1928年哥伦比亚的真实历史事件——美国联合果品公司的血腥镇压。当魔幻叙事在此处突然扎入'
            '历史的硬核时，产生了剧烈的现实主义冲击力。这种张力赋予了小说超越寓言的政治能量：它不是躲在魔幻中'
            '逃避现实，而是用魔幻来揭示现实中被掩盖的真相。阐释空间方面：可以从后殖民批评角度分析马孔多作为'
            '"第三世界被现代性侵入"的寓言；从女性主义角度分析乌尔苏拉作为家族真实统治者的权力运作；从历史哲学'
            '角度分析"循环时间观"对线性进步史观的颠覆——每一次阐释的打开，都是对作品丰富性的再次确认。'
        )},
        {'emoji':'📜','title':'批评共识与接受史','text': (
            '批评史上对《百年孤独》的主要争议集中在人物辨识度问题和政治叙事的间接性上。人物命名制度（奥雷里亚诺'
            '与阿尔卡蒂奥的重复使用）被广泛视为阅读障碍，甚至影响了作品的戏剧改编和影视化尝试（至今没有成功的'
            '电影改编）。部分左翼批评认为，小说对拉美政治现实的批判过于寓言化，缺乏直接的政治介入性。古巴作家'
            '卡彭铁尔曾含蓄地指出魔幻现实主义有"异国情调化"拉美现实的危险。自1967年出版后，迅速成为全球畅销书，'
            '被翻译成超过40种语言，1982年获诺贝尔文学奖被描述为"为拉美文学爆炸加冕"。近年来学术批评的焦点从'
            '"魔幻现实主义是什么"转向了"魔幻现实主义的全球旅行"——即这部作品如何影响了中国、印度、非洲、东欧'
            '等不同文化圈的作家，成为后殖民写作的跨文化范式。'
        )},
    ],
    'creative_inspiration': (
        '《百年孤独》对当代写作者最重要的启示不在于它的魔幻元素（飞毯、升天、鬼魂），而在于它如何将形式创新'
        '服务于内容表达。预叙手法不是炫技，而是为了传达一种"命运已被写就"的世界观；魔幻事件不是逃避现实，'
        '而是为了揭示那些被现实主义视为"不合逻辑"却真实存在的经验——比如拉丁美洲独裁政治的荒诞性、人民在'
        '历史暴力面前的失语。另一启示是"地方性的普世化"：一个哥伦比亚小镇的故事可以感动全世界读者，不是因为'
        '它的异国情调，而是因为马尔克斯在封闭的社区中开掘出了人类共通的孤独经验。当代写作者常陷入"写本地不被'
        '理解"或"为国际市场写作"的两难，而《百年孤独》示范了第三条道路：深入一个地方的具体经验，到最深处去，'
        '那里就是普世的。'
    ),
    'reading_suggestions': {
        'general': '不必因人物名字的重复而焦虑——名字的同与不同本身就是一个阅读线索，你只需要跟随故事的气流。',
        'research': (
            '可与《佩德罗·巴拉莫》对照研究"魔幻现实主义的谱系"，与《红楼梦》比较"家族小说的命运叙事"，'
            '与《喧哗与骚动》分析"时间技术的跨文化移植"。'
        )
    },
    'conclusion': (
        '马孔多的历史是从冰块开始的。那是一个"世界新生伊始"的时代，父亲带儿子去见识冰块——这个在文明世界'
        '中最普通的事物，在马孔多被当作吉卜赛人的奇迹。"摸起来像地狱里的东西"，上校多年后说。这一细节浓缩了'
        '整部小说的悲剧核心：拉美的现代性从来不是内生的发展，而是以"奇观"的形式降临的——冰块、磁铁、火车、'
        '香蕉公司、电影——每一个"进步"的背面都是新的奴役。《百年孤独》是一部关于遗忘的小说。马孔多居民在'
        '集体失忆症中需要贴标签才能记得日常生活，这一精妙的隐喻指向了拉美大陆更深的创伤：对历史的遗忘。上校的'
        '三十二次起义被遗忘，香蕉公司的大屠杀被遗忘，布恩迪亚家族的血脉在乱伦中走到尽头——"注定不会有第二次'
        '机会在大地上出现"。马尔克斯预言般的叙述语调让整部小说弥漫着一种深沉的疲倦：在历史的循环中，一切抗争'
        '最终归于尘土。然而，这部小说的伟大恰恰不在于它的悲观，而在于它在悲观中仍然保持的讲述欲。即使一切注定'
        '被遗忘，即使羊皮卷早已预言了结局，叙述本身仍然是一种抵抗——这正是《百年孤独》对文学的最终辩护：在'
        '命定的世界里，讲述是我们唯一的自由。当飓风卷走马孔多，当最后一只蚂蚁啃食掉那个猪尾巴婴儿，世界仿佛'
        '恢复到了"万物还没有名字"的原初状态。但读者知道，这本书的存在本身就是对遗忘的拒绝——只要还有人翻开'
        '第一页，读到"多年以后，面对行刑队，奥雷里亚诺·布恩迪亚上校将会回想起父亲带他去见识冰块的那个遥远的'
        '下午"，马孔多就永远没有真正消失。它存在于这句话的折页之间，存在于语言的废墟之上，存在于每一次被重新'
        '打开的此刻。'
    ),
    'appendix': [
        {'title':'文脉拾遗','icon':'fa-scroll','color':'#8b0000','text': (
            '何塞·阿尔卡蒂奥·布恩迪亚的"寻找伟大发明"之旅——他依据吉卜赛人的地图寻找通向黄金城的道路——'
            '直接呼应了亚马逊探险中"埃尔多拉多"传说的文学母题，塞万提斯与伏尔泰都在作品中使用过类似的情节。'
        )},
        {'title':'风物志','icon':'fa-mountain','color':'#2d6a4f','text': (
            '小说中的"香蕉公司"及其镇压事件，基于1928年哥伦比亚联合果品公司大罢工的真实历史，当时政府军'
            '屠杀了上千名罢工工人——这一事件在哥伦比亚主流历史叙事中被长期抹除。'
        )},
        {'title':'字里行间','icon':'fa-pen-fancy','color':'#b8860b','text': (
            '梅尔基亚德斯的羊皮卷被破译后证实为"用梵语写的家族史，偶数行用奥古斯都大帝的私人密码加密，奇数行'
            '用斯巴达军用密码"——这一对密码学的戏谑引用，是马尔克斯向博尔赫斯的智性游戏致敬。'
        )},
        {'title':'余音','icon':'fa-music','color':'#d97706','text': (
            '同年出生的中国作家莫言曾说："我第一次读到《百年孤独》时，非常惊讶——原来小说可以这样写。"'
            '莫言的《红高粱家族》《蛙》等作品中的魔幻现实书写，显见马尔克斯的影响。'
        )},
        {'title':'联结','icon':'fa-link','color':'#3b82f6','text': (
            '这部小说的气质与俄国作曲家穆索尔斯基的《图画展览会》有相通之处——同样是从一个主题（一个家族/'
            '一幅画）出发，发展出丰富多变的变奏，最终回到原点，完成一个封闭的循环。'
        )},
    ],
    'extended_reading': [
        {'title':'佩德罗·巴拉莫','author':'胡安·鲁尔福','reason':'魔幻现实主义的真正源头，马尔克斯承认"不读这本书就无法写出《百年孤独》"'},
        {'title':'玉米人','author':'米格尔·安赫尔·阿斯图里亚斯','reason':'以玛雅世界观构建的拉美神话叙事先行者'},
        {'title':'喧哗与骚动','author':'威廉·福克纳','reason':'时间技术与家族衰败叙事的现代主义范本'},
        {'title':'蛙','author':'莫言','reason':'看魔幻现实主义在中国语境中如何被本土化'},
    ],
    'fortune': {
        'grade':'上吉', 'keyword':'归墟',
        'text':'无可奈何花落去，似曾相识燕归来',
        'source':'宋·晏殊《浣溪沙》'
    },
}

# ── Layer colors and tier styles ──
LAYER_COLORS = {'A': '#8b0000', 'B': '#2d6a4f', 'C': '#b8860b', 'D': '#1a1a1a'}
LAYER_NAMES = {'A': '语言与形式', 'B': '叙事与内容', 'C': '思想与意义', 'D': '审美与影响'}

TOP_TIER_STYLES = {
    '文学之巅': 'color:#b8860b;background:rgba(184,134,11,.12)',
    '永恒殿堂': 'color:#b8860b;background:rgba(184,134,11,.08)',
    '不朽丰碑': 'color:#8b0000;background:rgba(139,0,0,.08)',
    '传世经典': 'color:#2d6a4f;background:rgba(45,106,79,.08)',
    '典范之作': 'color:#2d6a4f;background:rgba(45,106,79,.06)',
    '上乘佳作': 'color:#059669;background:rgba(5,150,105,.06)',
}

def esc(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

def pct(v):
    return round((v / 150) * 100, 1)

def nl2p(text):
    """Convert newlines to </p><p> for HTML paragraphs"""
    paras = [p.strip() for p in text.split('\n') if p.strip()]
    return '</p><p>'.join(paras) if paras else text

# ── Build the new demo HTML ──

def build_demo():
    d = data
    wcs_int = int(d['wcs'])
    # Pre-calculate stroke-dashoffset for score ring: circumference ≈ 358 (2*π*57)
    circumference = 2 * 3.14159 * 57  # ≈ 358.1
    offset = circumference * (1 - d['wcs'] / 150)

    tags_html = ''.join(
        f'<span class="tag" style="background:rgba(139,0,0,.06);border:1px solid rgba(139,0,0,.1);color:var(--crimson);font-size:11px;padding:2px 10px;border-radius:9999px">#{esc(t)}</span>'
        for t in d['tags']
    )

    # ── Layer bars ──
    layer_bars = ''
    for layer_id in ['A', 'B', 'C', 'D']:
        avg = d['layer_avgs'][layer_id]
        lc = LAYER_COLORS[layer_id]
        ln = LAYER_NAMES[layer_id]
        layer_bars += f'''
            <div style="display:flex;align-items:center;gap:12px">
              <span class="mono" style="font-size:11px;color:{lc};width:16px;font-weight:600">{layer_id}</span>
              <div class="bar-track" style="flex:1"><div class="bar-fill" style="width:{pct(avg)}%;background:{lc}" data-width="{pct(avg)}"></div></div>
              <span class="mono" style="font-size:14px;font-weight:700;color:{lc};width:42px;text-align:right">{avg:.2f}</span>
            </div>'''

    # ── Assessment summary ──
    best = d['best_dim']
    worst = d['worst_dim']
    assessment_html = f'''
        <hr class="rule-strong" style="margin-bottom:24px">
        <h2 class="serif" style="font-size:24px;font-weight:700;line-height:1.2;letter-spacing:.03em;margin-bottom:20px">评估概要</h2>
        <div class="glass-card" style="padding:24px;margin-bottom:24px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div style="padding:16px;background:rgba(45,106,79,.04);border:1px solid rgba(45,106,79,.15);border-radius:8px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <span class="text-xs mono" style="color:var(--jade);letter-spacing:1px;text-transform:uppercase"><i class="fas fa-arrow-up mr-1"></i>最突出优势</span>
                <span class="mono" style="font-size:20px;font-weight:700;color:var(--jade)">{best['score']:.1f}<span class="text-xs" style="font-weight:400;opacity:.6">/150</span></span>
              </div>
              <p class="text-xs serif" style="font-weight:600;color:var(--ink);margin-bottom:4px">{esc(best['name'])}</p>
              <p class="text-xs" style="color:var(--muted);line-height:1.7">{esc(best['reason'])}</p>
            </div>
            <div style="padding:16px;background:rgba(220,38,38,.04);border:1px solid rgba(220,38,38,.1);border-radius:8px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <span class="text-xs mono" style="color:#dc2626;letter-spacing:1px;text-transform:uppercase"><i class="fas fa-arrow-down mr-1"></i>最明显短板</span>
                <span class="mono" style="font-size:20px;font-weight:700;color:#dc2626">{worst['score']:.1f}<span class="text-xs" style="font-weight:400;opacity:.6">/150</span></span>
              </div>
              <p class="text-xs serif" style="font-weight:600;color:var(--ink);margin-bottom:4px">{esc(worst['name'])}</p>
              <p class="text-xs" style="color:var(--muted);line-height:1.7">{esc(worst['reason'])}</p>
            </div>
          </div>
          <p class="text-xs" style="color:var(--muted);margin-top:12px;padding-top:12px;border-top:1px solid var(--rule);line-height:1.8">本评级为LAS通用框架下的相对定位，以叙事性作品为基准原型。非叙事性体裁虽经体裁适配调整权重，仍可能存在结构性偏差。请结合核心维度得分与"体裁适配摘要"及"特殊说明"综合理解。</p>
        </div>'''

    # ── Scoring table ──
    table_rows = ''
    for i, dim in enumerate(d['dims']):
        lc = LAYER_COLORS[dim['layer']]
        tier_style = TOP_TIER_STYLES.get(dim['tier'], 'color:#8a8578;background:rgba(138,133,120,.06)')
        table_rows += f'''
          <tr style="border-bottom:1px solid var(--rule);cursor:pointer;transition:background .2s" onclick="var ex=document.getElementById('der{i}'),ar=document.getElementById('darr{i}');var op=ex.classList.contains('open');document.querySelectorAll('.demo-expand-row').forEach(e=>e.classList.remove('open'));document.querySelectorAll('.demo-arr').forEach(a=>a.style.transform='');if(!op){{ex.classList.add('open');ar.style.transform='rotate(180deg)'}}" onmouseenter="this.style.background='rgba(139,0,0,.03)'" onmouseleave="this.style.background=''">
            <td style="padding:10px 12px;font-size:13px;font-weight:500"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:6px;background:{lc}"></span>{esc(dim['name'])}</td>
            <td style="padding:10px 8px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted)">{dim['weight']}</td>
            <td style="padding:10px 8px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700">{dim['score']}</td>
            <td style="padding:10px 8px;text-align:center"><span style="font-size:11px;padding:2px 10px;border-radius:9999px;font-weight:600;{tier_style}">{esc(dim['tier'])}</span></td>
            <td style="padding:10px 12px;font-size:12px;color:var(--muted)">{esc(dim['benchmark'])}</td>
            <td style="padding:10px 6px;text-align:center"><i class="fas fa-chevron-down demo-arr" id="darr{i}" style="color:var(--muted);opacity:.3;font-size:10px;transition:transform .3s"></i></td>
          </tr>
          <tr>
            <td colspan="6" style="padding:0">
              <div class="demo-expand-row" id="der{i}" style="max-height:0;overflow:hidden;transition:max-height .4s ease">
                <div style="padding:8px 16px 14px;font-size:12px;color:var(--muted);line-height:1.8;background:rgba(26,26,26,.015);font-family:'Noto Serif SC',Georgia,serif">
                  <p><strong style="color:var(--ink)">① 基准表现：</strong>{esc(dim.get('gapLevel',''))}（vs {esc(dim['benchmark'])}）</p>
                  <p><strong style="color:var(--ink)">② 证据引用：</strong>{esc(dim.get('evidence',''))}</p>
                  <p><strong style="color:var(--ink)">③ 结论：</strong>{esc(dim.get('compare',''))}</p>
                </div>
              </div>
            </td>
          </tr>'''

    # ── Core benchmarks ──
    bench_cards = ''
    for b in d['benchmarks']:
        bench_cards += f'''
          <div class="glass-card" style="padding:16px;cursor:default;transition:all .25s">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <span class="mono" style="font-size:12px;background:{b['color']};color:var(--paper);width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700">{b['layer']}</span>
              <div>
                <p class="text-xs serif" style="font-weight:600;color:var(--ink)">《{esc(b['work'])}》</p>
                <p class="mono" style="font-size:10px;color:var(--muted)">{esc(b['dim'])} · {esc(b['tier'])}</p>
              </div>
            </div>
            <p class="text-xs" style="color:var(--muted);line-height:1.7">{esc(b['reason'])}</p>
          </div>'''

    # ── Deep analysis accordions ──
    accordions = ''
    for idx, sec in enumerate(d['deep_sections']):
        accordions += f'''
        <div class="glass-card" style="padding:0;margin-bottom:8px;overflow:hidden">
          <button onclick="var c=this.nextElementSibling;var i=this.querySelector('i');c.classList.toggle('open');i.classList.toggle('open')" style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:16px 20px;border:none;background:transparent;cursor:pointer;text-align:left">
            <div style="display:flex;align-items:center;gap:10px"><span style="font-size:18px">{sec['emoji']}</span><span class="serif" style="font-size:14px;font-weight:700">{esc(sec['title'])}</span></div>
            <i class="fas fa-chevron-down" style="color:var(--muted);font-size:10px;transition:transform .3s"></i>
          </button>
          <div class="accordion-content" style="max-height:0;overflow:hidden;transition:max-height .4s ease"><div style="padding:0 20px 16px">
            <p class="text-sm serif" style="line-height:2;color:var(--muted)">{esc(sec['text'])}</p>
          </div></div>
        </div>'''

    # ── Professional sections ──
    professional_html = f'''
        <div class="glass-card" style="padding:20px;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <i class="fas fa-book-reader" style="color:var(--jade);font-size:14px"></i>
            <h3 class="serif" style="font-size:14px;font-weight:700">创作启示</h3>
          </div>
          <p class="text-sm serif" style="line-height:2;color:var(--muted)">{esc(d['creative_inspiration'])}</p>
        </div>
        <div class="glass-card" style="padding:20px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <i class="fas fa-book-reader" style="color:var(--jade);font-size:14px"></i>
            <h3 class="serif" style="font-size:14px;font-weight:700">阅读与研习建议</h3>
          </div>
          <div class="text-sm serif" style="line-height:2;color:var(--muted)">
            <p><strong style="color:var(--muted)">面向普通读者：</strong>{esc(d['reading_suggestions']['general'])}</p>
            <p class="mt-1"><strong style="color:var(--muted)">面向研究者/教学者：</strong>{esc(d['reading_suggestions']['research'])}</p>
          </div>
        </div>'''

    # ── Conclusion ──
    conclusion_html = f'''
        <hr class="rule-strong" style="margin-bottom:24px">
        <h2 class="serif" style="font-size:24px;font-weight:700;line-height:1.2;letter-spacing:.03em;margin-bottom:20px">综合结论</h2>
        <div class="glass-card" style="padding:24px;margin-bottom:24px">
          <p class="serif" style="font-size:16px;font-weight:400;line-height:2.1;letter-spacing:.03em;color:var(--ink);text-align:justify">{esc(d['conclusion'])}</p>
        </div>'''

    # ── Appendix ──
    appendix_items = ''
    for item in d['appendix']:
        appendix_items += f'''
          <div class="glass-card" style="padding:16px">
            <h3 class="serif" style="font-size:13px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:8px"><i class="fas {item['icon']}" style="color:{item['color']}"></i>{esc(item['title'])}</h3>
            <p class="text-xs" style="color:var(--muted);line-height:1.8">{esc(item['text'])}</p>
          </div>'''

    # Extended reading
    er_items = ''
    for er in d['extended_reading']:
        er_items += f'''
          <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--muted);margin-bottom:8px">
            <span style="color:#8b5cf6;margin-top:1px"><i class="fas fa-book"></i></span>
            <div><span class="serif" style="font-weight:600;color:var(--ink)">《{esc(er['title'])}》</span> {esc(er['author'])}。{esc(er['reason'])}</div>
          </div>'''

    appendix_html = f'''
        <hr class="rule-strong" style="margin-bottom:24px">
        <h2 class="serif" style="font-size:24px;font-weight:700;line-height:1.2;letter-spacing:.03em;margin-bottom:20px">附录：创作余话</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-bottom:20px">
          {appendix_items}
        </div>
        <div class="glass-card" style="padding:16px">
          <h3 class="serif" style="font-size:13px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px"><i class="fas fa-book" style="color:#8b5cf6"></i>延伸阅读</h3>
          {er_items}
        </div>'''

    # ── Fortune ──
    f = d['fortune']
    fortune_html = f'''
        <div style="text-align:center;padding:32px 0 24px">
          <hr class="rule-strong" style="margin-bottom:28px">
          <p class="mono" style="font-size:11px;color:var(--muted);letter-spacing:4px;text-transform:uppercase;margin-bottom:12px">文学签文</p>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px">
            <span class="serif" style="font-size:18px;font-weight:700;color:var(--crimson)">{esc(f['grade'])}</span>
            <span style="color:var(--gold);opacity:.3">·</span>
            <span class="serif" style="font-size:18px;font-weight:700;color:var(--gold)">{esc(f['keyword'])}</span>
          </div>
          <p class="serif" style="font-size:16px;color:var(--ink);opacity:.6;font-weight:500;letter-spacing:.05em;margin-bottom:4px">{esc(f['text'])}</p>
          <p class="text-xs" style="color:var(--muted)">—— {esc(f['source'])}</p>
        </div>'''

    # ── Disclaimer ──
    disclaimer_html = '''
        <p class="text-xs" style="color:var(--muted);text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid var(--rule);opacity:.7">本报告由 AI 自动生成，仅供文学参考，不构成权威评价</p>'''

    # ── Assemble the full demo section ──
    demo = f'''
  <!-- Demo Report: 百年孤独 -->
  <section id="demo" class="reveal" style="padding:80px 24px;max-width:960px;margin:0 auto">
  <hr class="rule-strong mb-6">
  <p class="mono text-xs text-muted tracking-[4px] uppercase mb-1">EXAMPLE REPORT</p>
  <h2 class="serif" style="font-size:24px;font-weight:700;line-height:1.2;letter-spacing:.03em;margin-bottom:24px">示例报告</h2>
  <p class="text-sm" style="color:var(--muted);margin-bottom:32px;line-height:1.8">以下为 LAS 对《百年孤独》的真实分析结果（经典模式）。提交你的作品，即可获得同等深度的十六维标尺报告。</p>

  <!-- ═══ Demo: 百年孤独 — 完整报告副本 ═══ -->
  <div class="glass-card demo-report" style="padding:0;margin-bottom:24px;overflow:hidden;cursor:default">

    <!-- ═══ Hero ═══ -->
    <section style="padding:36px 32px 28px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:32px;flex-wrap:wrap">

        <!-- Left: meta + info -->
        <div style="flex:1;min-width:280px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <span class="mono" style="font-size:12px;color:var(--muted);letter-spacing:1px">LAS-20250121-47B3A</span>
            <span style="color:var(--muted);opacity:.4">·</span>
            <span class="text-xs" style="color:var(--muted)">长篇小说</span>
            <span style="color:var(--muted);opacity:.4">·</span>
            <span class="text-xs" style="color:var(--muted)">经典模式</span>
          </div>
          <p class="serif" style="font-size:clamp(2rem,5vw,3rem);font-weight:900;line-height:1.05;letter-spacing:.04em;color:var(--ink);margin-bottom:8px">《百年孤独》</p>
          <p class="serif" style="font-size:18px;font-weight:500;line-height:1.625;letter-spacing:.03em;color:var(--muted);margin-bottom:4px">加夫列尔·加西亚·马尔克斯 著 · 1967</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
            {tags_html}
          </div>

          <!-- Honorific title -->
          <div class="pl-4 border-l-2" style="border-color:var(--gold);margin-bottom:14px">
            <p class="text-[11px] text-muted uppercase tracking-widest mb-1 font-medium">荣誉称号</p>
            <p class="text-xl serif text-gold font-bold leading-snug">{esc(d['nickname'])}</p>
          </div>

          <!-- Sharp comment -->
          <div class="pl-4 border-l-2" style="border-color:var(--crimson);margin-bottom:14px">
            <p class="text-[11px] text-muted uppercase tracking-widest mb-1 font-medium">一句锐评</p>
            <p class="text-base serif text-crimson font-semibold leading-relaxed" id="demoSharpComment">{esc(d['one_liner'])}</p>
          </div>

          <!-- Literary echo -->
          <div class="pl-4 border-l-2" style="border-color:var(--gold);margin-bottom:14px">
            <p class="text-[11px] text-muted uppercase tracking-widest mb-1 font-medium">文心回响</p>
            <p class="text-sm serif" style="color:var(--ink);opacity:.5;line-height:1.6">{esc(d['literary_echo'])}</p>
            <p class="text-xs text-muted mt-0.5">—— {esc(d['literary_echo_source'])}</p>
          </div>
        </div>

        <!-- Right: score ring + tier -->
        <div style="text-align:center;flex-shrink:0">
          <div style="position:relative;width:130px;height:130px;margin:0 auto 10px">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="57" fill="none" stroke="rgba(26,26,26,.05)" stroke-width="7"/>
              <circle cx="65" cy="65" r="57" fill="none" stroke="#8b0000" stroke-width="7" stroke-linecap="round" stroke-dasharray="358" stroke-dashoffset="{offset:.1f}" transform="rotate(-90 65 65)" opacity=".9"/>
            </svg>
            <span class="mono" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:28px;font-weight:700;color:var(--ink);line-height:1">{d['wcs']:.2f}</span>
          </div>
          <span class="serif" style="display:inline-block;padding:4px 16px;border-radius:9999px;background:rgba(184,134,11,.12);color:var(--gold);font-size:15px;font-weight:700;margin-bottom:4px">{esc(d['tier'])}</span>
          <p class="text-xs" style="color:var(--muted);margin-top:4px">前 {d['percentile']}% · 122.18/150</p>
        </div>
      </div>

      <!-- Four-layer bars -->
      <div style="margin-top:24px;padding:18px 20px;border:1px solid var(--rule);border-radius:12px">
        <p class="text-xs mono" style="color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:14px">四层面均分</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          {layer_bars}
        </div>
      </div>
    </section>

    <!-- ═══ Expand trigger ═══ -->
    <button class="demo-trigger" onclick="var r=this.parentElement;r.classList.toggle('open');this.querySelector('.demo-chevron').style.transform=r.classList.contains('open')?'rotate(180deg)':''" style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:16px 32px;border:none;border-top:1px solid var(--rule-strong);background:transparent;cursor:pointer;color:var(--muted);font-family:'Noto Sans SC',sans-serif;font-size:14px;transition:all .2s">
      <span class="mono" style="font-size:11px;letter-spacing:2px">点击展开完整分析报告 (16 维度评分详表 + 基准对标 + 深度分析 + 综合结论)</span>
      <i class="fas fa-chevron-down demo-chevron" style="font-size:11px;transition:transform .3s"></i>
    </button>

    <!-- ═══ Expandable detail ═══ -->
    <div class="demo-detail" style="max-height:0;overflow:hidden;transition:max-height .6s ease">

      <div style="padding:8px 32px 32px">

        <!-- 评估概要 -->
        {assessment_html}

        <!-- 作品概况 + 金句 -->
        <hr class="rule-strong" style="margin-bottom:24px">
        <h2 class="serif" style="font-size:24px;font-weight:700;line-height:1.2;letter-spacing:.03em;margin-bottom:20px">作品概况</h2>
        <p class="text-sm serif" style="line-height:2.1;color:var(--muted);margin-bottom:20px">{esc(d['overview'])}</p>
        <div class="pl-4 border-l-2" style="border-color:var(--gold);margin-bottom:24px">
          <p class="text-[10px] text-muted uppercase tracking-widest mb-2 font-medium">金句</p>
          <blockquote class="serif" style="font-size:18px;font-weight:500;line-height:1.7;font-style:italic;color:var(--ink)" id="demoGoldenQuote">"{esc(d['golden_quote'])}"</blockquote>
        </div>

        <!-- 评分详表 -->
        <hr class="rule-strong" style="margin-bottom:24px">
        <h2 class="serif" style="font-size:24px;font-weight:700;line-height:1.2;letter-spacing:.03em;margin-bottom:20px">评分详表</h2>
        <div style="overflow-x:auto;margin-bottom:24px">
          <table style="width:100%;font-size:13px;min-width:680px;border-collapse:collapse" role="table">
            <thead>
              <tr style="border-bottom:2px solid var(--rule-strong)">
                <th style="text-align:left;padding:10px 12px;font-size:11px;color:var(--muted);font-weight:600">维度</th>
                <th style="text-align:center;padding:10px 8px;font-size:11px;color:var(--muted);font-weight:600;width:56px">权重</th>
                <th style="text-align:center;padding:10px 8px;font-size:11px;color:var(--muted);font-weight:600;width:56px">分数</th>
                <th style="text-align:center;padding:10px 8px;font-size:11px;color:var(--muted);font-weight:600;width:88px">档位</th>
                <th style="text-align:left;padding:10px 12px;font-size:11px;color:var(--muted);font-weight:600">核心基准</th>
                <th style="width:28px"></th>
              </tr>
            </thead>
            <tbody>{table_rows}</tbody>
          </table>
        </div>
        <p class="text-xs" style="color:var(--muted);text-align:center;margin-top:-12px;margin-bottom:24px">点击行查看证据链与比较详情</p>

        <!-- 核心基准集 -->
        <hr class="rule-strong" style="margin-bottom:24px">
        <h2 class="serif" style="font-size:24px;font-weight:700;line-height:1.2;letter-spacing:.03em;margin-bottom:20px">核心基准集</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-bottom:24px">
          {bench_cards}
        </div>

        <!-- 深度文学分析 -->
        <hr class="rule-strong" style="margin-bottom:24px">
        <h2 class="serif" style="font-size:24px;font-weight:700;line-height:1.2;letter-spacing:.03em;margin-bottom:20px">深度文学分析</h2>
        <div style="margin-bottom:24px">
          {accordions}
        </div>

        <!-- 专业视角 -->
        <hr class="rule-strong" style="margin-bottom:24px">
        <h2 class="serif" style="font-size:24px;font-weight:700;line-height:1.2;letter-spacing:.03em;margin-bottom:20px">专业视角应用</h2>
        <div style="margin-bottom:24px">
          {professional_html}
        </div>

        <!-- 综合结论 -->
        {conclusion_html}

        <!-- 附录 -->
        {appendix_html}

        <!-- 文学签文 -->
        {fortune_html}

        <!-- Disclaimer -->
        {disclaimer_html}

      </div>
    </div>
  </div>

  <div style="text-align:center;margin-top:28px">
    <a href="/app" class="hero-cta serif" style="display:inline-flex;margin-right:12px">提交作品</a>
    <a href="/app#/register" class="hero-cta serif" style="display:inline-flex;border-color:var(--muted);color:var(--muted)">免费试用</a>
  </div>
  </section>'''

    return demo


# ── Main: read lascd.html, replace demo section, write back ──

def main():
    target = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'index.html')
    with open(target, 'r', encoding='utf-8') as f:
        html = f.read()

    start_marker = '<!-- Demo Report: 百年孤独 -->'
    end_marker = '</section>\n\n</main>\n\n<footer class="py-12">'

    start = html.find(start_marker)
    end = html.find(end_marker)

    if start < 0 or end < 0:
        print(f'ERROR: markers not found. start={start}, end={end}')
        return

    new_demo = build_demo()
    new_html = html[:start] + new_demo + '\n\n</main>\n\n<footer class="py-12">' + html[html.find('<footer class="py-12">', end) + len('<footer class="py-12">'):]

    with open(target, 'w', encoding='utf-8') as f:
        f.write(new_html)

    print(f'Done. Demo replaced ({len(new_demo)} chars).')
    # Verify
    with open(target, 'r', encoding='utf-8') as f:
        verify = f.read()
    assert '<!-- Demo Report: 百年孤独 -->' in verify
    assert '文学坐标与谱系定位' in verify
    assert '批评共识与接受史' in verify
    assert '评分详表' in verify
    assert '专业视角应用' in verify
    assert '附录：创作余话' in verify
    assert '综合结论' in verify
    print('Verification: all key sections present.')

if __name__ == '__main__':
    main()
