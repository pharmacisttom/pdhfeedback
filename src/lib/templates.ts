export interface SurveyTemplateQuestion {
  questionText: string;
  type: "RATING_1_5" | "RATING_SMILEY_1_5" | "NPS_0_10" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "SHORT_TEXT" | "LONG_TEXT" | "YES_NO";
  helpText?: string;
  isRequired: boolean;
  isOverallCSAT?: boolean;
  options?: { optionText: string; optionValue: string }[];
}

export interface SurveyTemplate {
  id: string;
  name: string;
  category: "HOSPITAL" | "CLINIC" | "PHARMACY" | "COOP" | "RETAIL" | "TRAINING";
  description: string;
  questions: SurveyTemplateQuestion[];
}

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: "hospital_opd",
    name: "แบบประเมินความพึงพอใจ แผนกผู้ป่วยนอก (OPD) โรงพยาบาล/คลินิก",
    category: "HOSPITAL",
    description: "เหมาะสำหรับจุดบริการตรวจโรคทั่วไป, งานเวชระเบียน, จุดคัดกรอง และห้องตรวจแพทย์",
    questions: [
      {
        questionText: "ความรวดเร็วและความสะดวกในการรับบริการ",
        type: "RATING_1_5",
        helpText: "1 = น้อยที่สุด, 5 = มากที่สุด",
        isRequired: true,
      },
      {
        questionText: "การดูแลเอาใจใส่ ความสุภาพ และการให้ข้อมูลของแพทย์และพยาบาล",
        type: "RATING_1_5",
        helpText: "1 = น้อยที่สุด, 5 = มากที่สุด",
        isRequired: true,
      },
      {
        questionText: "ความสะอาด ความสะดวกสบายของสถานที่ และจุดพักคอย",
        type: "RATING_1_5",
        isRequired: true,
      },
      {
        questionText: "ความพึงพอใจโดยรวมต่อการเข้ารับบริการในครั้งนี้",
        type: "RATING_1_5",
        isRequired: true,
        isOverallCSAT: true,
      },
      {
        questionText: "ความน่าจะเป็นที่ท่านจะแนะนำบริการของโรงพยาบาลแก่ญาติมิตรหรือคนรู้จัก (NPS)",
        type: "NPS_0_10",
        helpText: "0 = ไม่แนะนำเลย, 10 = แนะนำแน่นอน",
        isRequired: false,
      },
      {
        questionText: "ข้อเสนอแนะเพิ่มเติมเพื่อการปรับปรุงการบริการ",
        type: "LONG_TEXT",
        helpText: "กรุณาไม่ระบุเลขบัตรประชาชน ข้อมูลสุขภาพ หรือข้อมูลส่วนบุคคลของผู้อื่น",
        isRequired: false,
      },
    ],
  },
  {
    id: "pharmacy",
    name: "แบบประเมินความพึงพอใจ งานบริการห้องยาและจ่ายยา",
    category: "PHARMACY",
    description: "วัดความถูกต้อง ชัดเจนในการอธิบายวิธีใช้ยา และความรวดเร็วในการจ่ายยา",
    questions: [
      {
        questionText: "ระยะเวลาในการรอรับยา",
        type: "RATING_1_5",
        isRequired: true,
      },
      {
        questionText: "ความชัดเจน ครบถ้วน และความสุภาพในการอธิบายวิธีรับประทานยาและข้อควรระวัง",
        type: "RATING_1_5",
        isRequired: true,
      },
      {
        questionText: "เภสัชกรเปิดโอกาสให้สอบถามข้อสงสัยเกี่ยวกับยา",
        type: "YES_NO",
        isRequired: true,
      },
      {
        questionText: "ความพึงพอใจโดยรวมต่องานบริการห้องยา",
        type: "RATING_1_5",
        isRequired: true,
        isOverallCSAT: true,
      },
      {
        questionText: "ข้อเสนอแนะเพิ่มเติมสำหรับห้องยา",
        type: "LONG_TEXT",
        isRequired: false,
      },
    ],
  },
  {
    id: "cooperative_finance",
    name: "แบบประเมินความพึงพอใจ สหกรณ์ / สถาบันการเงิน / เคาน์เตอร์บริการ",
    category: "COOP",
    description: "เน้นความถูกต้องของธุรกรรม ความโปร่งใส และการให้บริการของเจ้าหน้าที่",
    questions: [
      {
        questionText: "ความรวดเร็วในการให้บริการและการจัดการคิว",
        type: "RATING_1_5",
        isRequired: true,
      },
      {
        questionText: "ความรู้ ความชำนาญ และความถูกต้องในการทำธุรกรรมของเจ้าหน้าที่",
        type: "RATING_1_5",
        isRequired: true,
      },
      {
        questionText: "ความสุภาพและการให้คำแนะนำด้วยความเต็มใจ",
        type: "RATING_1_5",
        isRequired: true,
      },
      {
        questionText: "ความพึงพอใจโดยรวมต่อการให้บริการสหกรณ์",
        type: "RATING_1_5",
        isRequired: true,
        isOverallCSAT: true,
      },
      {
        questionText: "ท่านต้องการแนะนำสหกรณ์ให้แก่สมาชิกท่านอื่นหรือไม่ (NPS)",
        type: "NPS_0_10",
        isRequired: false,
      },
      {
        questionText: "ข้อเสนอแนะเพื่อพัฒนาการบริการ",
        type: "LONG_TEXT",
        isRequired: false,
      },
    ],
  },
  {
    id: "retail_service",
    name: "แบบประเมินร้านค้า จุดจำหน่ายสินค้า และบริการทั่วไป",
    category: "RETAIL",
    description: "ประเมินคุณภาพสินค้า บรรยากาศร้าน และพนักงาน",
    questions: [
      {
        questionText: "การต้อนรับและความเป็นมิตรของพนักงาน",
        type: "RATING_SMILEY_1_5",
        isRequired: true,
      },
      {
        questionText: "คุณภาพและความคุ้มค่าของสินค้าและบริการ",
        type: "RATING_1_5",
        isRequired: true,
      },
      {
        questionText: "ความสะอาด ความเป็นระเบียบของสถานที่",
        type: "RATING_1_5",
        isRequired: true,
      },
      {
        questionText: "ความพึงพอใจโดยรวม",
        type: "RATING_1_5",
        isRequired: true,
        isOverallCSAT: true,
      },
      {
        questionText: "ข้อคิดเห็นเพิ่มเติม",
        type: "LONG_TEXT",
        isRequired: false,
      },
    ],
  },
  {
    id: "training_event",
    name: "แบบประเมินการฝึกอบรม สัมมนา และกิจกรรม",
    category: "TRAINING",
    description: "ประเมินเนื้อหา วิทยากร ประโยชน์ที่ได้รับ และการอำนวยความสะดวก",
    questions: [
      {
        questionText: "เนื้อหาหลักสูตรมีความเหมาะสมและตรงตามความคาดหวัง",
        type: "RATING_1_5",
        isRequired: true,
      },
      {
        questionText: "ความรู้ ความเชี่ยวชาญ และความสามารถในการถ่ายทอดของวิทยากร",
        type: "RATING_1_5",
        isRequired: true,
      },
      {
        questionText: "การอำนวยความสะดวก สถานที่ อาหาร และโสตทัศนูปกรณ์",
        type: "RATING_1_5",
        isRequired: true,
      },
      {
        questionText: "ท่านสามารถนำความรู้ที่ได้รับไปปรับใช้ในการทำงานได้จริง",
        type: "RATING_1_5",
        isRequired: true,
      },
      {
        questionText: "ความพึงพอใจในภาพรวมต่อการจัดอบรม/สัมมนาในครั้งนี้",
        type: "RATING_1_5",
        isRequired: true,
        isOverallCSAT: true,
      },
      {
        questionText: "หัวข้อหรือทักษะที่ท่านสนใจให้จัดเพิ่มเติมในครั้งถัดไป",
        type: "LONG_TEXT",
        isRequired: false,
      },
    ],
  },
];
