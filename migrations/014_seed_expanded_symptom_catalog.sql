INSERT INTO symptom_groups (code, name, description, sort_order) VALUES
  ('MUSCULOESQUELETICO', 'Musculoesqueletico', 'Dor, limitacao funcional, trauma e sintomas osteomusculares.', 70),
  ('DERMATOLOGICO', 'Dermatologico', 'Lesoes, manchas, prurido e alteracoes de pele.', 80),
  ('OTORRINO', 'Otorrinolaringologico', 'Sintomas de ouvido, nariz, garganta e vias aereas superiores.', 90),
  ('OFTALMOLOGICO', 'Oftalmologico', 'Sintomas visuais e oculares.', 100),
  ('GINECOLOGICO', 'Ginecologico e obstetrico', 'Sintomas ginecologicos, obstetricos e mamarios.', 110),
  ('METABOLICO_ENDOCRINO', 'Metabolico e endocrino', 'Sintomas ligados a metabolismo, hidratacao, glicemia e hormonios.', 120),
  ('PSIQUICO', 'Psiquico e comportamental', 'Sintomas emocionais, cognitivos e comportamentais.', 130),
  ('HEMATOLOGICO', 'Hematologico', 'Sangramentos, palidez e sinais hematologicos.', 140)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = TRUE;

INSERT INTO symptoms (group_id, code, name, keywords, sort_order)
SELECT g.id, s.code, s.name, s.keywords, s.sort_order
FROM symptom_groups g
JOIN (VALUES
  ('DOR', 'DOR_OUVIDO', 'Dor de ouvido', ARRAY['otalgia','dor de ouvido','ouvido dolorido'], 60),
  ('DOR', 'DOR_ARTICULAR', 'Dor articular', ARRAY['artralgia','dor articular','dor nas juntas','juntas doloridas'], 70),
  ('DOR', 'DOR_MUSCULAR', 'Dor muscular', ARRAY['mialgia','dor muscular','musculo dolorido','dores no corpo'], 80),
  ('DOR', 'DOR_PELVICA', 'Dor pelvica', ARRAY['dor pelvica','dor em baixo ventre','dor baixo ventre','pelve'], 90),
  ('DOR', 'DOR_TESTICULAR', 'Dor testicular', ARRAY['dor testicular','dor no testiculo','escroto doloroso'], 100),

  ('GERAL', 'FRAQUEZA', 'Fraqueza', ARRAY['fraqueza','astenia','prostracao','prostração'], 40),
  ('GERAL', 'SUDORESE', 'Sudorese', ARRAY['sudorese','suor frio','transpiracao','transpiração'], 50),
  ('GERAL', 'CALAFRIOS', 'Calafrios', ARRAY['calafrios','tremores de frio'], 60),
  ('GERAL', 'INCHACO', 'Inchaco', ARRAY['edema','inchaco','inchaço','retencao de liquido','retenção de liquido'], 70),
  ('GERAL', 'LINFONODOS', 'Caroços ou ínguas', ARRAY['linfonodo','adenomegalia','ingua','íngua','caroco','caroço'], 80),

  ('RESPIRATORIO', 'DOR_PLEURITICA', 'Dor ao respirar', ARRAY['dor pleuritica','dor pleurítica','dor ao respirar','dor inspiratoria','dor inspiratória'], 50),
  ('RESPIRATORIO', 'EXPECTORACAO', 'Expectoracao', ARRAY['escarro','expectoração','expectoracao','catarro'], 60),
  ('RESPIRATORIO', 'ESCARRO_SANGUE', 'Sangue no escarro', ARRAY['hemoptise','sangue no escarro','escarro com sangue'], 70),
  ('RESPIRATORIO', 'ROUQUIDAO', 'Rouquidao', ARRAY['rouquidao','rouquidão','disfonia','voz rouca'], 80),
  ('RESPIRATORIO', 'APNEIA', 'Pausas respiratorias', ARRAY['apneia','pausa respiratoria','pausa respiratória'], 90),

  ('CARDIOVASCULAR', 'DOR_PEITO', 'Dor no peito', ARRAY['dor no peito','dor toracica','dor torácica','precordialgia','angina'], 50),
  ('CARDIOVASCULAR', 'DESMAIO_ESFORCO', 'Desmaio aos esforcos', ARRAY['sincope ao esforco','síncope ao esforço','desmaio ao esforco','desmaio ao esforço'], 60),
  ('CARDIOVASCULAR', 'EDEMA_PERNAS', 'Inchaco nas pernas', ARRAY['edema de membros inferiores','pernas inchadas','inchaco nas pernas','inchaço nas pernas'], 70),
  ('CARDIOVASCULAR', 'BATIMENTO_IRREGULAR', 'Batimento irregular', ARRAY['arritmia','batimento irregular','ritmo irregular','extrassistole'], 80),

  ('DIGESTIVO', 'CONSTIPACAO', 'Prisao de ventre', ARRAY['constipacao','constipação','prisao de ventre','prisão de ventre','intestino preso'], 50),
  ('DIGESTIVO', 'AZIA', 'Azia', ARRAY['azia','pirose','queimacao','queimação','refluxo'], 60),
  ('DIGESTIVO', 'ICTERICIA', 'Pele ou olhos amarelados', ARRAY['ictericia','icterícia','pele amarela','olhos amarelos'], 70),
  ('DIGESTIVO', 'DISTENSAO_ABDOMINAL', 'Barriga inchada', ARRAY['distensao abdominal','distensão abdominal','barriga inchada','abdome distendido'], 80),
  ('DIGESTIVO', 'FALTA_APETITE', 'Falta de apetite', ARRAY['anorexia','falta de apetite','inapetencia','inapetência'], 90),
  ('DIGESTIVO', 'DIFICULDADE_ENGOLIR', 'Dificuldade para engolir', ARRAY['disfagia','dificuldade para engolir','engasgos'], 100),

  ('NEUROLOGICO', 'DOR_CABECA_FORTE', 'Dor de cabeca intensa', ARRAY['cefaleia intensa','pior dor de cabeca','pior dor de cabeça','cefaleia súbita','cefaleia subita'], 50),
  ('NEUROLOGICO', 'PERDA_FORCA', 'Perda de forca', ARRAY['paresia','perda de forca','perda de força','fraqueza em um lado','hemiparesia'], 60),
  ('NEUROLOGICO', 'DIFICULDADE_FALAR', 'Dificuldade para falar', ARRAY['afasia','disartria','dificuldade para falar','fala enrolada'], 70),
  ('NEUROLOGICO', 'ALTERACAO_VISAO', 'Alteracao visual neurologica', ARRAY['perda visual','visao dupla','visão dupla','diplopia','amaurose'], 80),
  ('NEUROLOGICO', 'FORMIGAMENTO', 'Formigamento', ARRAY['parestesia','formigamento','dormencia','dormência'], 90),
  ('NEUROLOGICO', 'TREMOR', 'Tremor', ARRAY['tremor','tremedeira'], 100),
  ('NEUROLOGICO', 'PERDA_MEMORIA', 'Perda de memoria', ARRAY['amnesia','perda de memoria','perda de memória','esquecimento'], 110),

  ('URINARIO', 'DOR_LOMBAR_URINARIA', 'Dor lombar com sintomas urinarios', ARRAY['colica renal','cólica renal','dor lombar urinaria','dor lombar urinária','dor no flanco'], 30),
  ('URINARIO', 'URINA_ESCURA', 'Urina escura', ARRAY['urina escura','coluria','colúria'], 40),
  ('URINARIO', 'POUCA_URINA', 'Pouca urina', ARRAY['oliguria','oligúria','pouca urina','redução da urina'], 50),
  ('URINARIO', 'PERDA_URINA', 'Perda de urina', ARRAY['incontinencia urinaria','incontinência urinária','perda de urina'], 60),
  ('URINARIO', 'URINA_ESPUMA', 'Urina com espuma', ARRAY['urina espumosa','espuma na urina','proteinuria','proteinúria'], 70),

  ('MUSCULOESQUELETICO', 'TRAUMA', 'Trauma', ARRAY['trauma','acidente','pancada','contusao','contusão'], 10),
  ('MUSCULOESQUELETICO', 'FRATURA_SUSPEITA', 'Suspeita de fratura', ARRAY['fratura','osso quebrado','deformidade','crepitacao','crepitação'], 20),
  ('MUSCULOESQUELETICO', 'LIMITACAO_MOVIMENTO', 'Limitacao de movimento', ARRAY['limitacao de movimento','limitação de movimento','rigidez','dificuldade de movimentar'], 30),
  ('MUSCULOESQUELETICO', 'INCHACO_ARTICULAR', 'Inchaco articular', ARRAY['derrame articular','articulacao inchada','articulação inchada','joelho inchado'], 40),
  ('MUSCULOESQUELETICO', 'DOR_COLUNA', 'Dor na coluna', ARRAY['dor na coluna','cervicalgia','dorsalgia','lombalgia'], 50),

  ('DERMATOLOGICO', 'MANCHAS_PELE', 'Manchas na pele', ARRAY['exantema','rash','manchas na pele','lesoes cutaneas','lesões cutâneas'], 10),
  ('DERMATOLOGICO', 'COCEIRA', 'Coceira', ARRAY['prurido','coceira','comichao','comichão'], 20),
  ('DERMATOLOGICO', 'FERIDA', 'Ferida', ARRAY['ferida','ulcera','úlcera','lesao','lesão','corte'], 30),
  ('DERMATOLOGICO', 'BOLHAS', 'Bolhas', ARRAY['vesiculas','vesículas','bolhas','flictenas'], 40),
  ('DERMATOLOGICO', 'VERMELHIDAO_PELE', 'Vermelhidao na pele', ARRAY['eritema','vermelhidao','vermelhidão','pele vermelha'], 50),
  ('DERMATOLOGICO', 'SECRECAO_PELE', 'Secrecao em ferida', ARRAY['pus','secrecao','secreção','ferida infeccionada'], 60),

  ('OTORRINO', 'DOR_GARGANTA', 'Dor de garganta', ARRAY['odinofagia','dor de garganta','garganta inflamada'], 10),
  ('OTORRINO', 'NARIZ_ENTUPIDO', 'Nariz entupido', ARRAY['congestao nasal','congestão nasal','nariz entupido','obstrucao nasal','obstrução nasal'], 20),
  ('OTORRINO', 'SANGRAMENTO_NARIZ', 'Sangramento nasal', ARRAY['epistaxe','sangramento nasal','sangue no nariz'], 30),
  ('OTORRINO', 'PERDA_AUDICAO', 'Perda de audicao', ARRAY['perda auditiva','perda de audicao','perda de audição','hipoacusia'], 40),
  ('OTORRINO', 'ZUMBIDO', 'Zumbido', ARRAY['zumbido','tinnitus','tinido'], 50),
  ('OTORRINO', 'SECRECAO_OUVIDO', 'Secrecao no ouvido', ARRAY['otorreia','secrecao no ouvido','secreção no ouvido'], 60),

  ('OFTALMOLOGICO', 'OLHO_VERMELHO', 'Olho vermelho', ARRAY['olho vermelho','hiperemia ocular','conjuntivite'], 10),
  ('OFTALMOLOGICO', 'DOR_OCULAR', 'Dor ocular', ARRAY['dor ocular','dor no olho','oftalmalgia'], 20),
  ('OFTALMOLOGICO', 'SECRECAO_OCULAR', 'Secrecao ocular', ARRAY['secrecao ocular','secreção ocular','remela','pus no olho'], 30),
  ('OFTALMOLOGICO', 'FOTOFOBIA', 'Fotofobia', ARRAY['fotofobia','sensibilidade a luz','sensibilidade à luz'], 40),
  ('OFTALMOLOGICO', 'VISAO_EMBACADA', 'Visao embacada', ARRAY['visao embacada','visão embaçada','baixa visual','turvacao visual','turvação visual'], 50),

  ('GINECOLOGICO', 'SANGRAMENTO_VAGINAL', 'Sangramento vaginal', ARRAY['sangramento vaginal','metrorragia','menorragia','sangramento uterino'], 10),
  ('GINECOLOGICO', 'CORRIMENTO', 'Corrimento vaginal', ARRAY['corrimento vaginal','leucorreia','corrimento'], 20),
  ('GINECOLOGICO', 'ATRASO_MENSTRUAL', 'Atraso menstrual', ARRAY['atraso menstrual','amenorreia','gravidez'], 30),
  ('GINECOLOGICO', 'DOR_MAMARIA', 'Dor mamaria', ARRAY['mastalgia','dor mamaria','dor mamária','dor na mama'], 40),
  ('GINECOLOGICO', 'CONTRACOES', 'Contracoes uterinas', ARRAY['contracoes','contrações','trabalho de parto','dor em contracao'], 50),

  ('METABOLICO_ENDOCRINO', 'SEDE_EXCESSIVA', 'Sede excessiva', ARRAY['polidipsia','sede excessiva','muita sede'], 10),
  ('METABOLICO_ENDOCRINO', 'URINA_EXCESSIVA', 'Urina excessiva', ARRAY['poliuria','poliúria','urinar muito','muita urina'], 20),
  ('METABOLICO_ENDOCRINO', 'FOME_EXCESSIVA', 'Fome excessiva', ARRAY['polifagia','fome excessiva','muita fome'], 30),
  ('METABOLICO_ENDOCRINO', 'GANHO_PESO', 'Ganho de peso', ARRAY['ganho de peso','aumento de peso'], 40),
  ('METABOLICO_ENDOCRINO', 'INTOLERANCIA_FRIO', 'Intolerancia ao frio', ARRAY['intolerancia ao frio','intolerância ao frio','frio excessivo'], 50),
  ('METABOLICO_ENDOCRINO', 'INTOLERANCIA_CALOR', 'Intolerancia ao calor', ARRAY['intolerancia ao calor','intolerância ao calor','calor excessivo'], 60),

  ('PSIQUICO', 'ANSIEDADE', 'Ansiedade', ARRAY['ansiedade','crise de ansiedade','panico','pânico'], 10),
  ('PSIQUICO', 'HUMOR_DEPRIMIDO', 'Humor deprimido', ARRAY['depressao','depressão','tristeza','humor deprimido'], 20),
  ('PSIQUICO', 'INSONIA', 'Insonia', ARRAY['insonia','insônia','dificuldade para dormir'], 30),
  ('PSIQUICO', 'IDEACAO_SUICIDA', 'Ideacao suicida', ARRAY['ideacao suicida','ideação suicida','pensamento suicida','suicidio','suicídio'], 40),
  ('PSIQUICO', 'AGITACAO', 'Agitacao', ARRAY['agitacao','agitação','inquietacao','inquietação'], 50),

  ('HEMATOLOGICO', 'PALIDEZ', 'Palidez', ARRAY['palidez','hipocorado','anemia'], 10),
  ('HEMATOLOGICO', 'SANGRAMENTO_FACIL', 'Sangramento facil', ARRAY['sangramento facil','sangramento fácil','epistaxe recorrente','gengivorragia'], 20),
  ('HEMATOLOGICO', 'MANCHAS_ROXAS', 'Manchas roxas', ARRAY['equimose','hematoma','purpura','púrpura','manchas roxas'], 30)
) AS s(group_code, code, name, keywords, sort_order) ON s.group_code = g.code
ON CONFLICT (code) DO UPDATE SET
  group_id = EXCLUDED.group_id,
  name = EXCLUDED.name,
  keywords = EXCLUDED.keywords,
  sort_order = EXCLUDED.sort_order,
  active = TRUE;
