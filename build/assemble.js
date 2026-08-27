const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const OUT = path.join(DIR, '..', 'Maths_Building_Blocks.html');

const g4Body = fs.readFileSync(path.join(DIR, 'g4_body.js'), 'utf8');
const g6Body = fs.readFileSync(path.join(DIR, 'g6_body.js'), 'utf8');
const g5Body = fs.readFileSync(path.join(DIR, 'g5_body.js'), 'utf8');
const fpBody = fs.readFileSync(path.join(DIR, 'fp_body.js'), 'utf8');

// ---------------------------------------------------------------------
// TUTOR NOTES (prefixed, reusing verified original wording for g4/g6)
// ---------------------------------------------------------------------
const TUTOR_NOTES_G4 = `
  g4_placevalue: "Grade 4 numbers go up to 9999, so this checks the same skill as bundling on a place value chart, just one column further than Grade 3. If she cannot do this confidently for 3 digit numbers yet, it is worth stepping back before pushing into thousands.",
  g4_compare: "Comparing starts from the leftmost digit, the biggest place value column, not the last digit. If she compares from the right, that is the exact misconception to address, and a place value chart makes it visible.",
  g4_doublehalf: "Doubling and halving are mental math anchors that support multiplication and division later, doubling is really multiplying by 2, halving is dividing by 2. If she has to count on her fingers for double 6, that fact is worth drilling on its own before moving on.",
  g4_fillten: "This is the mental strategy behind carrying and borrowing, knowing how far a number is from the next multiple of ten makes column addition and subtraction click. Say it out loud as a question, for example forty seven and how much more makes fifty.",
  g4_addsub: "By Term 2, Grade 4 learners are expected to add and subtract 4 digit numbers, usually with regrouping. If the column method breaks down, go back to expanded notation, writing each number out in thousands, hundreds, tens and units, before returning to the short method. Start on an easier level here if 4 digits are still shaky.",
  g4_multiply: "CAPS builds this up in stages, 2 digit by 1 digit first, then 2 digit by 2 digit. Do not move to the harder mode until the easier one is fluent, since the strategies, like breaking numbers apart, build directly on each other.",
  g4_divide: "CAPS Grade 4 introduces division as the inverse of multiplication, so if she knows that 6 times 7 is 42, she already knows that 42 divided by 6 is 7. Point that connection out explicitly. The remainder mode is a natural next step once exact division is solid.",
  g4_numsentence: "A number sentence with a missing number is algebra in disguise. Encourage her to say the sentence in words first, for example twenty four plus what number makes sixty one, rather than jumping straight to an operation.",
  g4_tables: "Multiplication and division both depend on this fluency. A few minutes of mixed recall most days beats one long weekly drill.",
  g4_comparefrac: "This is the exact CAPS Grade 4 skill, comparing fractions with different denominators using a picture, not a rule. Resist teaching a shortcut for finding common denominators yet, the visual comparison here is what builds the number sense that later shortcuts rely on.",
  g4_addfrac: "Grade 4 CAPS only expects addition and subtraction of fractions with the same denominator. If a worksheet shows different denominators, that is Grade 5 content, so it is fine to say so and come back to it later.",
  g4_length: "Millimetres, centimetres and metres are the units Grade 4 uses most, kilometres are introduced but used less often. A tape measure or metre stick at home makes these conversions concrete rather than a memorised rule.",
  g4_capacity: "Millilitres and litres are easiest to feel using real containers, an empty two litre bottle or a measuring jug is worth more than several worksheets on its own.",
  g4_mass: "Grams and kilograms work the same way as the other units, a kitchen scale is a genuinely useful manipulative here, weighing real household items builds a sense of scale a worksheet alone cannot.",
  g4_time: "CAPS places formal time work in Term 4, so if you are working through Term 2 and 3 in order this is a preview, not a repeat of something she has already covered. Reading an analogue clock still depends on place value thinking, since the minute hand jumps in groups of 5.",
  g4_shapes3d: "Flat faces versus curved surfaces is the core Grade 4 distinction. A tin can, a ball and a cereal box are all sitting in the kitchen, so this is another good topic to teach with real objects rather than only pictures. Counting edges and vertices is slightly beyond the Grade 4 wording but is good solid extension practice once faces are secure.",
  g4_symmetry: "Line symmetry is genuine Grade 4 Term 3 content. A real mirror placed on the line is the fastest way to check an answer, if the reflection matches, the line is a line of symmetry.",
  g4_gridref: "This is the actual Grade 4 CAPS position skill, using letters across the top and numbers up the side, like a simple map or a battleships style grid. It is a different skill from describing a movement, which comes next as a bonus topic.",
  g4_angles: "This one is a preview of Grade 5, Grade 4 CAPS only covers straight versus curved sides. It is still worth introducing gently if she is ready, comparing an angle to the corner of a book, a right angle, is the easiest way in.",
  g4_translate: "This is also a preview of Grade 5, formal translations are not Grade 4 content. Grade 4 only uses alpha-numeric grid references, so treat this as an optional stretch activity rather than core practice.",
  g4_numpattern: "CAPS Grade 4 patterns either add or subtract the same amount each time, or multiply by the same amount each time. Ask her to say the rule out loud before finding the next number, guessing without a rule is not the skill being tested here. The complex level goes beyond a constant rule, which is good stretch thinking but should not be the first thing she tries.",
  g4_geopattern: "These patterns grow in a picture, not just in a list of numbers, so counting the blocks in each step by hand, out loud, before answering is more valuable here than mental arithmetic alone.",`;

const TUTOR_NOTES_G6 = `
  g6_placevalue: "This checks whether the learner understands that a digit's value depends on its position, not just the digit itself. If they keep picking the digit rather than its column value, go back to physical bundling with base ten blocks or bundled sticks before returning to this activity.",
  g6_rounding: "Rounding depends completely on secure place value. If they get the nearest 10 right but not the nearest 100, that usually means the ones and tens boundary is solid but the tens and hundreds boundary is not yet.",
  g6_bonds: "Speed here is a stand in for automatic recall. If they are counting on their fingers instead of just knowing the answer, that is not a problem to fix in one sitting, it just means more short daily practice, five minutes at a time, works better than one long session.",
  g6_tables: "Let the learner choose easier tables first, such as 2, 5 and 10, to build confidence before adding harder ones. Getting the strategy right, like skip counting or doubling, matters more than raw speed while a fact is still new.",
  g6_factfamily: "This shows whether the learner sees addition and subtraction, or multiplication and division, as connected operations rather than four separate unrelated rules. Seeing that connection is what makes later algebra manageable.",
  g6_equivfrac: "Finding an equivalent fraction is really a multiplication skill in disguise, since the top and bottom are multiplied by the same number. If they are stuck, a fraction wall, drawn or printed, lets them see it physically first.",
  g6_fdp: "The hundred grid is the single best bridge between fractions, decimals and percentages, because all three are just different ways of describing the same shaded amount. It is worth spending real time here, even if it feels slow, since it pays off across the whole percentage and decimal unit.",
  g6_fracops: "Same denominator fractions are the easiest case, because the pieces are already the same size. This is the right place to build confidence before ever tackling fractions with different denominators.",
  g6_ratio: "Encourage the learner to draw or group real objects before writing any numbers. Ratio only really clicks once it is felt physically as groups, not just as a colon between two digits.",
  g6_shapes: "This depends less on shaky number sense and more on memorised properties, so it is a good confidence booster to use on a harder day.",
  g6_mirror: "Reflections are about position, not calculation, so this is another good low pressure topic. If they struggle, physically fold a piece of paper in half and let them watch the mirror image appear as you unfold it.",
  g6_databars: "Data handling works best with real, personally meaningful data. If the learner is involved in collecting the information themselves, reading the finished graph becomes far more motivating than a ready made worksheet.",
  g6_wordprobs: "These combine several skills in one question, which is exactly what a test will do. If the maths is right but the answer is still wrong, that is often a reading comprehension issue, so read the question aloud together first.",`;

const TUTOR_NOTES_G5 = `
  g5_placevalue: "Grade 5 extends place value to 6 digit numbers, one more column than Grade 4's 4 digit range. If a learner is shaky here, check 4 digit Grade 4 place value first before pushing into hundreds of thousands.",
  g5_addsub: "5 digit column addition and subtraction leans hard on regrouping across several columns in a row. Expanded notation, writing out thousands, hundreds, tens and units separately, is still the best fallback if the short method breaks down.",
  g5_multiply: "3 digit by 2 digit multiplication is usually taught by breaking one number into parts, for example 234 times 16 as 234 times 10 plus 234 times 6. Encourage that breakdown out loud before reaching for a written algorithm.",
  g5_divide: "This extends Grade 4's 3 digit by 1 digit division to a 2 digit divisor. Estimating first, for example roughly how many times does 23 go into 480, builds the number sense that makes the exact working easier.",
  g5_fracmixed: "Mixed numbers combine a whole number with a fraction. The most common error is forgetting to carry a whole number when the fraction part adds up to more than 1, so it is worth checking that specific step separately.",
  g5_decimals: "This checks decimal comparison, not calculation. A common misconception is treating a decimal like a whole number, for example thinking 4.9 is smaller than 4.15 because 9 is a smaller looking last digit than 15. Line the digits up in columns to make the mistake visible.",
  g5_area: "Counting squares is the concrete foundation underneath the area formulas that come later. If a learner is fluent here, the leap to length times width for a rectangle becomes obvious rather than a rule to memorise.",
  g5_time: "Converting between 12 hour and 24 hour time is really just adding or subtracting 12 hours once past midday. A learner who separately knows their times tables and place value sometimes still trips on this simply from unfamiliarity, so repetition helps more than explanation here.",
  g5_angles: "Naming angle categories depends on comparing to a right angle, exactly like Grade 4, just with more categories added. A real right angle, like the corner of a book, is still the best physical reference point.",
  g5_transform: "This is a vocabulary and visualisation skill rather than a calculation. Acting the movement out physically, sliding, flipping or turning an actual object, makes the difference between the three types far more obvious than reading a description.",
  g5_shapes2d: "This is the same property recall skill as Grade 4's shape quiz, extended with the heptagon. If a learner has the Grade 4 shapes solid, this is mostly just one new name to learn.",
  g5_numpattern: "Grade 5 patterns can change their own rule partway through, for example the gap between numbers growing each time. Get the learner to write the gaps between each pair of numbers underneath the sequence, that written trail usually reveals the rule.",`;

const TUTOR_NOTES_FP = `
  fp_counting: "Before, after and between questions check genuine number order understanding, not just rote counting. If a learner can recite numbers in order but struggles here, that is a sign the counting is not yet connected to real number sense.",
  fp_addsub: "The exact number range matters a lot at this stage, working within 20 confidently is a real achievement and should not be rushed past. Concrete counters, fingers, or a number line are appropriate tools here, not a shortcut to be phased out too early.",
  fp_skipcount: "Skip counting is the informal root of later multiplication tables, counting in 2s, 5s and 10s especially. Saying the count out loud while pointing at real objects, like pairs of shoes for 2s, builds the connection between the words and the quantity.",
  fp_shapes: "Sorting by straight versus curved sides is the Foundation Phase entry point into geometry, well before formal names like quadrilateral are needed. Real household objects, a ball, a box, a plate, are more useful here than pictures alone.",
  fp_patterns: "Copying and extending a pattern is early algebraic thinking, noticing and continuing a rule. If a learner cannot say what repeats, physically laying out real objects, buttons or blocks, in the pattern often makes the repeating unit click.",
  fp_measure: "At this stage, comparison language, longer, shorter, heavier, lighter, matters more than any number or unit. Formal units like centimetres and kilograms are introduced later and should sit on top of solid comparison skills, not replace them.",
  fp_money: "South African coins and notes are the actual objects used here, since money is one of the few maths topics with genuine everyday relevance for a young child. Real or play money in hand is far more effective than a picture on a screen.",
  fp_data: "Reading a one to one pictograph is the entry point into all later data handling and graph work. The skill being checked is careful counting and comparing, not any calculation.",`;

// ---------------------------------------------------------------------
// ACTIVITIES registries (prefixed)
// ---------------------------------------------------------------------
const ACTIVITIES_G4 = `
  g4_placevalue: { icon: '🔢', title: 'Place Value Explorer', desc: 'Find the value of a digit in a 4 digit number.' },
  g4_compare: { icon: '⚖️', title: 'Compare and Order', desc: 'Choose the correct sign, less than, greater than, or equal to.' },
  g4_doublehalf: { icon: '🪞', title: 'Double and Half', desc: 'Double or halve a number, with 3 difficulty levels.' },
  g4_fillten: { icon: '🎯', title: 'Filling Up Tens', desc: 'How much more to reach the next friendly number.' },
  g4_addsub: { icon: '➕', title: 'Add and Subtract Blitz', desc: 'Choose 2, 3 or 4 digit numbers.' },
  g4_multiply: { icon: '✖️', title: 'Multiplication Practice', desc: '2 digit by 1 digit, and 2 digit by 2 digit.' },
  g4_divide: { icon: '➗', title: 'Division Practice', desc: 'With an exact answer, or with a remainder.' },
  g4_numsentence: { icon: '🧩', title: 'Number Sentences', desc: 'Find the missing number in a number sentence.' },
  g4_tables: { icon: '📐', title: 'Times Tables Blitz', desc: 'Pick which tables to drill, then answer fast.' },
  g4_comparefrac: { icon: '🍕', title: 'Compare Fractions', desc: 'Which fraction is bigger? Use the picture to decide.' },
  g4_addfrac: { icon: '🍰', title: 'Add and Subtract Fractions', desc: 'Same denominator fractions, with instant checking.' },
  g4_length: { icon: '📏', title: 'Length', desc: 'Convert millimetres, centimetres, metres and kilometres.' },
  g4_capacity: { icon: '🧃', title: 'Capacity and Volume', desc: 'Convert millilitres and litres.' },
  g4_mass: { icon: '🏋️', title: 'Mass', desc: 'Convert grams and kilograms.' },
  g4_time: { icon: '🕐', title: 'Time', desc: 'Read the clock and solve time problems.', badge: 'Term 4 preview' },
  g4_shapes3d: { icon: '📦', title: '3D Object Properties', desc: 'Faces, flat surfaces and curved surfaces, 8 different objects.' },
  g4_symmetry: { icon: '🦋', title: 'Symmetry', desc: 'Does the shape have a line of symmetry where it is drawn?' },
  g4_gridref: { icon: '🗺️', title: 'Grid References', desc: 'Locate an object using letters and numbers on a grid.', badge: 'Term 4 preview' },
  g4_angles: { icon: '📐', title: 'Angles', desc: 'Right angle, smaller, or bigger.', badge: 'Grade 5 preview' },
  g4_translate: { icon: '🧭', title: 'Translations', desc: 'Follow a move on the grid.', badge: 'Grade 5 preview' },
  g4_numpattern: { icon: '🔁', title: 'Number Patterns', desc: 'Simple, medium or complex sequences.' },
  g4_geopattern: { icon: '🔶', title: 'Growing Patterns', desc: 'Count the blocks, simple to complex.' },`;

const ACTIVITIES_G6 = `
  g6_placevalue: { icon: '🔢', title: 'Place Value Detective', desc: 'Find the value of a digit in a number. Multiple choice.' },
  g6_rounding: { icon: '🎯', title: 'Round It', desc: 'Round numbers to the nearest 10 and 100.' },
  g6_bonds: { icon: '⚡', title: 'Number Bonds Blitz', desc: 'Rapid fire bonds to 20, with a running score.' },
  g6_tables: { icon: '✖️', title: 'Times Tables Blitz', desc: 'Pick which tables to drill, then answer fast.' },
  g6_factfamily: { icon: '🔺', title: 'Fact Family Builder', desc: 'Given 3 numbers, write all 4 related facts.' },
  g6_equivfrac: { icon: '🍰', title: 'Equivalent Fractions', desc: 'Convert a fraction to an equivalent one with a bigger denominator.' },
  g6_fdp: { icon: '💯', title: 'Fraction, Decimal, Percentage Grid', desc: 'Click to shade a 100 grid and watch all 3 forms update live.' },
  g6_fracops: { icon: '➕', title: 'Fraction Add and Subtract', desc: 'Practise adding and subtracting fractions with the same denominator.' },
  g6_ratio: { icon: '⚖️', title: 'Ratio Word Problems', desc: 'Real world ratio problems with instant checking.' },
  g6_shapes: { icon: '🔷', title: 'Shape Property Quiz', desc: 'Sides, vertices and equal sides questions on 2D shapes.' },
  g6_mirror: { icon: '🪞', title: 'Mirror Match', desc: 'Reflect a shape across the mirror line by clicking cells.' },
  g6_databars: { icon: '📊', title: 'Tally and Bar Chart Builder', desc: 'Tally a survey and watch a live bar chart build itself.' },
  g6_wordprobs: { icon: '📝', title: 'Mixed Word Problems', desc: 'Review problems mixing fractions, percentage, ratio and measurement.' },`;

const ACTIVITIES_G5 = `
  g5_placevalue: { icon: '🔢', title: 'Place Value Explorer', desc: 'Find the value of a digit in a 5 or 6 digit number.' },
  g5_addsub: { icon: '➕', title: 'Add and Subtract Blitz', desc: '5 digit numbers.' },
  g5_multiply: { icon: '✖️', title: 'Multiplication Practice', desc: '3 digit by 2 digit numbers.' },
  g5_divide: { icon: '➗', title: 'Division Practice', desc: '3 digit by 2 digit, exact or with a remainder.' },
  g5_fracmixed: { icon: '🍰', title: 'Add and Subtract Mixed Numbers', desc: 'Same denominator, including whole numbers.' },
  g5_decimals: { icon: '🔢', title: 'Compare Decimals', desc: 'Order decimals to 2 decimal places.' },
  g5_area: { icon: '🟩', title: 'Area by Counting Squares', desc: 'Rectangles and simple L-shapes.' },
  g5_time: { icon: '🕐', title: '12 Hour and 24 Hour Time', desc: 'Convert between the two formats.' },
  g5_angles: { icon: '📐', title: 'Named Angles', desc: 'Acute, right, obtuse or straight.' },
  g5_transform: { icon: '🔄', title: 'Transformation Spotter', desc: 'Translation, reflection or rotation?' },
  g5_shapes2d: { icon: '🔷', title: '2D Shape Properties', desc: 'Sides and vertices, now including the heptagon.' },
  g5_numpattern: { icon: '🔁', title: 'Number Patterns', desc: 'Patterns where the rule itself can change.' },`;

const ACTIVITIES_FP = `
  fp_counting: { icon: '🔢', title: 'Counting and Number Recognition', desc: 'Before, after and between, levelled Grade R to 3.' },
  fp_addsub: { icon: '➕', title: 'Addition and Subtraction', desc: 'Levelled from within 20 up to within 999.' },
  fp_skipcount: { icon: '🔟', title: 'Skip Counting', desc: 'Count on in 2s, 5s, 10s and more.' },
  fp_shapes: { icon: '🔵', title: 'Shape Sorting', desc: 'Straight sides or round? Sort everyday shapes.' },
  fp_patterns: { icon: '🔁', title: 'Simple Patterns', desc: 'Copy and extend a repeating pattern.' },
  fp_measure: { icon: '📏', title: 'Measurement Basics', desc: 'Compare informally, or choose a sensible unit.' },
  fp_money: { icon: '💰', title: 'Money', desc: 'Add up South African coins and notes.' },
  fp_data: { icon: '📊', title: 'Reading a Pictograph', desc: 'Count and compare a simple picture graph.' },`;

// ---------------------------------------------------------------------
// SECTIONS per level
// ---------------------------------------------------------------------
const SECTIONS_BY_LEVEL = `
const SECTIONS_BY_LEVEL = {
  foundation: [
    { title: 'Number Sense', keys: ['fp_counting', 'fp_addsub', 'fp_skipcount'] },
    { title: 'Space and Shape', keys: ['fp_shapes'] },
    { title: 'Patterns', keys: ['fp_patterns'] },
    { title: 'Measurement and Money', keys: ['fp_measure', 'fp_money'] },
    { title: 'Data Handling', keys: ['fp_data'] },
  ],
  '4': [
    { title: 'Number Sense', keys: ['g4_placevalue', 'g4_compare', 'g4_doublehalf', 'g4_fillten'] },
    { title: 'Operations', keys: ['g4_addsub', 'g4_multiply', 'g4_divide', 'g4_numsentence', 'g4_tables'] },
    { title: 'Fractions', keys: ['g4_comparefrac', 'g4_addfrac'] },
    { title: 'Measurement', keys: ['g4_length', 'g4_capacity', 'g4_mass', 'g4_time'] },
    { title: 'Space and Shape', keys: ['g4_shapes3d', 'g4_symmetry', 'g4_gridref', 'g4_angles', 'g4_translate'] },
    { title: 'Patterns', keys: ['g4_numpattern', 'g4_geopattern'] },
  ],
  '5': [
    { title: 'Number Sense', keys: ['g5_placevalue', 'g5_addsub'] },
    { title: 'Operations', keys: ['g5_multiply', 'g5_divide'] },
    { title: 'Fractions and Decimals', keys: ['g5_fracmixed', 'g5_decimals'] },
    { title: 'Measurement', keys: ['g5_area', 'g5_time'] },
    { title: 'Space and Shape', keys: ['g5_angles', 'g5_transform', 'g5_shapes2d'] },
    { title: 'Patterns', keys: ['g5_numpattern'] },
  ],
  '6': [
    { title: 'Number Sense', keys: ['g6_placevalue', 'g6_rounding', 'g6_bonds', 'g6_tables', 'g6_factfamily'] },
    { title: 'Fractions, Decimals and Percentage', keys: ['g6_equivfrac', 'g6_fdp', 'g6_fracops', 'g6_ratio'] },
    { title: 'Space and Shape', keys: ['g6_shapes', 'g6_mirror'] },
    { title: 'Data Handling', keys: ['g6_databars'] },
    { title: 'Mixed Review', keys: ['g6_wordprobs'] },
  ],
};
const LEVEL_LABELS = { foundation: 'Foundation Phase', '4': 'Level 4', '5': 'Level 5', '6': 'Level 6' };
`;

// ---------------------------------------------------------------------
// BUILDERS map (goTo dispatcher)
// ---------------------------------------------------------------------
const BUILDERS_MAP = `
  const builders = {
    fp_counting: fp_renderCounting, fp_addsub: fp_renderAddSub, fp_skipcount: fp_renderSkipCount,
    fp_shapes: fp_renderShapes, fp_patterns: fp_renderPatterns, fp_measure: fp_renderMeasure,
    fp_money: fp_renderMoney, fp_data: fp_renderData,
    g4_placevalue: g4_renderPlaceValue, g4_compare: g4_renderCompare, g4_doublehalf: g4_renderDoubleHalf, g4_fillten: g4_renderFillTen,
    g4_addsub: g4_renderAddSub, g4_multiply: g4_renderMultiply, g4_divide: g4_renderDivide, g4_numsentence: g4_renderNumSentence,
    g4_tables: g4_renderTables, g4_comparefrac: g4_renderCompareFrac, g4_addfrac: g4_renderAddFrac,
    g4_length: g4_renderLength, g4_capacity: g4_renderCapacity, g4_mass: g4_renderMass, g4_time: g4_renderTime,
    g4_shapes3d: g4_renderShapes3D, g4_symmetry: g4_renderSymmetry, g4_gridref: g4_renderGridRef,
    g4_angles: g4_renderAngles, g4_translate: g4_renderTranslate,
    g4_numpattern: g4_renderNumPattern, g4_geopattern: g4_renderGeoPattern,
    g5_placevalue: g5_renderPlaceValue, g5_addsub: g5_renderAddSub, g5_multiply: g5_renderMultiply, g5_divide: g5_renderDivide,
    g5_fracmixed: g5_renderFracMixed, g5_decimals: g5_renderDecimals, g5_area: g5_renderArea, g5_time: g5_renderTime,
    g5_angles: g5_renderAngles, g5_transform: g5_renderTransform, g5_shapes2d: g5_renderShapes2D, g5_numpattern: g5_renderNumPattern,
    g6_placevalue: g6_renderPlaceValue, g6_rounding: g6_renderRounding, g6_bonds: g6_renderBonds,
    g6_tables: g6_renderTables, g6_factfamily: g6_renderFactFamily, g6_equivfrac: g6_renderEquivFrac,
    g6_fdp: g6_renderFDP, g6_fracops: g6_renderFracOps, g6_ratio: g6_renderRatio, g6_shapes: g6_renderShapes,
    g6_mirror: g6_renderMirror, g6_databars: g6_renderDataBars, g6_wordprobs: g6_renderWordProblems,
  };
`;

// ---------------------------------------------------------------------
// Shared head/CSS (grade4 CSS as base + grade6 extra classes aliased to beach colors + level tabs)
// ---------------------------------------------------------------------
const HEAD = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Maths Building Blocks</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --ocean: #0284C7;
    --ocean-dark: #075985;
    --ocean-light: #E0F2FE;
    --aqua: #06B6D4;
    --aqua-dark: #0E7490;
    --aqua-light: #CFFAFE;
    --coral: #FB7185;
    --coral-dark: #E11D48;
    --coral-light: #FFE4E6;
    --sand: #D9A441;
    --sand-dark: #A8791F;
    --sand-light: #FBF0DA;
    --grey-bg: #F2FAFB;
    --card-bg: #FFFFFF;
    --border: #D9EEF3;
    --text: #12303B;
    --text-soft: #4F7480;
    --good: #157F3C;
    --good-bg: #E6F5EA;
    --bad: #C0392B;
    --bad-bg: #FBEAEA;
    --shade: var(--ocean);
    /* legacy aliases so ported activity CSS keeps working unchanged */
    --purple: var(--ocean); --purple-dark: var(--ocean-dark); --purple-light: var(--ocean-light);
    --blue: var(--aqua-dark); --blue-light: var(--aqua-light);
    --orange: var(--sand); --orange-light: var(--sand-light);
    --pink: var(--coral); --pink-light: var(--coral-light);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background:
      radial-gradient(circle at 6% 10%, rgba(6,182,212,0.08) 0, transparent 40%),
      radial-gradient(circle at 94% 16%, rgba(251,113,133,0.07) 0, transparent 42%),
      radial-gradient(circle at 50% 96%, rgba(217,164,65,0.08) 0, transparent 45%),
      var(--grey-bg);
    color: var(--text);
  }
  h1, h2, h3, .tile h3, button { font-family: 'Baloo 2', -apple-system, BlinkMacSystemFont, sans-serif; }
  header {
    position: relative;
    background: linear-gradient(120deg, var(--ocean-dark) 0%, var(--ocean) 50%, var(--aqua) 100%);
    color: #fff;
    padding: 26px 20px 40px;
    text-align: center;
    overflow: hidden;
  }
  header h1 { margin: 0 0 4px; font-size: 1.7rem; font-weight: 800; letter-spacing: 0.02em; }
  header p { margin: 0; color: #E3F7FB; font-size: 0.92rem; }
  header .wave { position: absolute; left: 0; right: 0; bottom: -1px; width: 100%; height: 30px; display: block; }
  .level-tabs { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin: 18px 0 0; position: relative; z-index: 1; }
  .level-tab {
    background: rgba(255,255,255,0.16); color: #fff; border: 1.5px solid rgba(255,255,255,0.55);
    border-radius: 20px; padding: 7px 16px; font-weight: 700; font-size: 0.88rem; cursor: pointer;
    font-family: 'Baloo 2', sans-serif;
  }
  .level-tab:hover { background: rgba(255,255,255,0.28); }
  .level-tab.active { background: #fff; color: var(--ocean-dark); border-color: #fff; }
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px 16px 60px;
  }
  .card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 10px rgba(2,132,199,0.07);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 14px;
  }
  .section-heading {
    font-family: 'Baloo 2', sans-serif; font-weight: 800; color: var(--ocean-dark);
    font-size: 1.1rem; margin: 24px 0 10px; padding-left: 2px;
  }
  .section-heading:first-child { margin-top: 4px; }
  .tile {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 16px 18px;
    cursor: pointer;
    text-align: left;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    border-top: 4px solid var(--tile-color, var(--ocean));
  }
  .tile:hover { transform: translateY(-3px); box-shadow: 0 8px 18px rgba(2,132,199,0.16); }
  .tile .dot {
    flex: 0 0 auto;
    width: 40px; height: 40px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.25rem;
    background: var(--tile-bg, var(--ocean-light));
    color: var(--tile-color, var(--ocean));
  }
  .tile h3 { margin: 0 0 4px; font-size: 1.0rem; color: var(--ocean-dark); font-weight: 700; }
  .tile p { margin: 0; font-size: 0.82rem; color: var(--text-soft); }
  .tile .badge { display: inline-block; font-size: 0.68rem; font-weight: 700; color: var(--coral-dark); background: var(--coral-light); border-radius: 8px; padding: 2px 7px; margin-top: 6px; }
  .backbtn {
    background: none; border: none; color: var(--coral-dark); font-weight: 700;
    cursor: pointer; font-size: 0.92rem; padding: 4px 0; margin-bottom: 10px;
    display: inline-flex; align-items: center; gap: 4px;
  }
  .backbtn:hover { text-decoration: underline; }
  h2.activity-title { color: var(--ocean-dark); margin: 0 0 6px; font-size: 1.4rem; font-weight: 800; }
  .subtext { color: var(--text-soft); font-size: 0.92rem; margin: 0 0 14px; line-height: 1.4; }
  .levelnote { display: inline-block; font-size: 0.72rem; font-weight: 700; color: var(--coral-dark); background: var(--coral-light); border-radius: 8px; padding: 3px 9px; margin: 0 0 12px; }

  .tutor-box { margin-bottom: 16px; }
  button.tutor-toggle {
    background: var(--sand-light); color: #6B4E14; border: 1.5px dashed var(--sand);
    border-radius: 10px; padding: 8px 14px; font-size: 0.85rem; font-weight: 700; cursor: pointer;
  }
  button.tutor-toggle:hover { background: #F5E3BC; }
  .tutor-panel {
    display: none; margin-top: 10px; background: var(--sand-light); border-radius: 10px;
    padding: 12px 14px; font-size: 0.86rem; color: #5C4110; line-height: 1.5; border-left: 4px solid var(--sand);
  }

  button.action {
    background: linear-gradient(120deg, var(--coral), #FB8FA0); color: #fff; border: none; border-radius: 10px;
    padding: 10px 18px; font-size: 0.95rem; font-weight: 700; cursor: pointer;
    margin-right: 8px; margin-top: 8px;
  }
  button.action:hover { filter: brightness(0.95); }
  button.secondary {
    background: #fff; color: var(--ocean-dark); border: 1.5px solid var(--border); border-radius: 10px;
    padding: 10px 18px; font-size: 0.95rem; font-weight: 700; cursor: pointer;
    margin-right: 8px; margin-top: 8px;
  }
  button.secondary:hover { border-color: var(--ocean); }
  button.small { padding: 6px 12px; font-size: 0.85rem; border-radius: 8px; }
  input[type=text], input[type=number] {
    border: 1.5px solid var(--border); border-radius: 10px; padding: 9px 12px;
    font-size: 1rem; width: 130px; margin-right: 8px;
  }
  input[type=text]:focus, input[type=number]:focus { outline: 2px solid var(--coral); border-color: var(--coral); }
  .feedback {
    margin-top: 14px; padding: 12px 14px; border-radius: 12px; font-weight: 700;
    display: none; font-size: 0.95rem;
  }
  .feedback.good { display: block; background: var(--good-bg); color: var(--good); }
  .feedback.bad { display: block; background: var(--bad-bg); color: var(--bad); }
  .feedback.info { display: block; background: var(--aqua-light); color: var(--aqua-dark); font-weight: 600; }
  .scorepill {
    display: inline-block; background: var(--aqua-light); color: var(--aqua-dark);
    font-weight: 800; font-size: 0.85rem; padding: 5px 12px; border-radius: 20px; margin-bottom: 12px;
  }
  .q-box {
    font-size: 1.15rem; font-weight: 700; color: var(--ocean-dark); margin: 14px 0;
    background: var(--ocean-light); border-radius: 12px; padding: 14px 16px;
  }
  .mcq-opts { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
  .mcq-opt {
    border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 16px;
    cursor: pointer; font-weight: 700; color: var(--ocean-dark); background: #fff;
  }
  .mcq-opt:hover { border-color: var(--coral); }
  .mcq-opt.correct { background: var(--good-bg); border-color: var(--good); color: var(--good); }
  .mcq-opt.wrong { background: var(--bad-bg); border-color: var(--bad); color: var(--bad); }
  .fracbar { display: flex; gap: 2px; margin: 6px 0; }
  .fracbar .seg { flex: 1; height: 34px; border: 1.5px solid var(--ocean-dark); background: #fff; }
  .fracbar .seg.filled { background: var(--coral); }
  .fracbar .seg:first-child { border-radius: 6px 0 0 6px; }
  .fracbar .seg:last-child { border-radius: 0 6px 6px 0; }
  .fraclabel { font-size: 0.85rem; color: var(--text-soft); margin-bottom: 2px; }
  .pattern-grid { display: grid; gap: 3px; margin: 8px 0; }
  .pattern-grid .blk { width: 22px; height: 22px; border-radius: 4px; background: var(--border); }
  .pattern-grid .blk.on { background: var(--coral); }
  .pattern-step { display: inline-block; text-align: center; margin: 0 16px 10px 0; vertical-align: top; }
  .pattern-step .count { font-weight: 800; color: var(--ocean-dark); margin-top: 4px; }
  .hint-toggle { color: var(--aqua-dark); background: none; border: none; cursor: pointer; font-size: 0.88rem; font-weight: 700; padding: 0; margin-top: 10px; }
  .hint-text { display: none; margin-top: 8px; font-size: 0.88rem; color: var(--text-soft); background: var(--aqua-light); padding: 10px 12px; border-radius: 10px; }
  .posgrid { display: inline-grid; gap: 2px; margin: 10px 0; }
  .posgrid .pcell { width: 42px; height: 42px; background: #fff; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
  .posgrid .pcell.clickable { cursor: pointer; }
  .posgrid .pcell.clickable:hover { background: var(--ocean-light); }
  .posgrid .pcell.start { background: var(--sand-light); border-color: var(--sand); }
  .posgrid .pcell.picked { background: var(--coral-light); border-color: var(--coral); }
  .posgrid .pcell.headcell { background: var(--ocean-dark); color: #fff; font-weight: 700; font-size: 0.8rem; }

  /* ---- classes ported from the Grade 6 app (Level 6 activities), colors alias to the beach palette above ---- */
  .gridwrap { display: inline-block; }
  .hundred-grid { display: grid; grid-template-columns: repeat(10, 26px); gap: 2px; margin: 14px 0; }
  .hundred-grid .cell {
    width: 26px; height: 26px; border: 1px solid var(--border); border-radius: 3px; cursor: pointer; background: #fff;
  }
  .hundred-grid .cell.shaded { background: var(--shade); border-color: var(--ocean-dark); }
  .readout { display: flex; gap: 18px; flex-wrap: wrap; margin: 12px 0; }
  .readout .box { background: var(--ocean-light); border-radius: 12px; padding: 10px 16px; text-align: center; min-width: 90px; }
  .readout .box .val { font-size: 1.25rem; font-weight: 800; color: var(--ocean-dark); }
  .readout .box .lbl { font-size: 0.75rem; color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.03em; }
  .mirror-grid { display: grid; grid-template-columns: repeat(12, 30px); gap: 2px; margin: 14px 0; width: max-content; }
  .mirror-grid .cell { width: 30px; height: 30px; border: 1px solid var(--border); background: #fff; }
  .mirror-grid .cell.given { background: var(--aqua-dark); border-color: var(--ocean-dark); }
  .mirror-grid .cell.clickable { cursor: pointer; }
  .mirror-grid .cell.userfill { background: var(--coral); border-color: var(--ocean-dark); }
  .mirror-grid .mirrorline { border-right: 3px solid var(--sand) !important; }
  .tally-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .tally-row input[type=text] { width: 110px; }
  .tally-row .count { font-weight: 800; color: var(--ocean-dark); min-width: 24px; text-align: center; }
  .bar-chart { display: flex; align-items: flex-end; gap: 18px; height: 180px; margin: 18px 0 6px; border-bottom: 2px solid var(--border); padding: 0 6px; }
  .bar-col { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; width: 60px; }
  .bar-col .num { font-weight: 800; color: var(--ocean-dark); font-size: 0.85rem; margin-bottom: 4px; }
  .bar-col .bar { width: 40px; border-radius: 8px 8px 0 0; transition: height 0.2s ease; }
  .bar-col .lbl { margin-top: 6px; font-size: 0.78rem; color: var(--text-soft); text-align: center; }

  footer { text-align: center; color: var(--text-soft); font-size: 0.8rem; padding: 20px; }
</style>
</head>
<body>
<header>
  <h1>Maths building blocks</h1>
  <p>CAPS aligned practice from Foundation Phase through Level 6. Bonus topics are marked below each activity.</p>
  <div class="level-tabs" id="level-tabs"></div>
  <svg class="wave" viewBox="0 0 1440 60" preserveAspectRatio="none">
    <path d="M0,30 C240,60 480,0 720,18 C960,36 1200,60 1440,28 L1440,60 L0,60 Z" fill="#F2FAFB"></path>
  </svg>
</header>
<main id="app"></main>
<footer>Built for independent practice between sessions and for use during therapy. All content authored to match CAPS, not from an official past paper bank.</footer>

<script>
`;

const UTILITIES = `
// ---------- Utilities ----------
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = randInt(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function fracBar(numerator, denominator) {
  let segs = '';
  for (let i = 0; i < denominator; i++) segs += \`<div class="seg \${i < numerator ? 'filled' : ''}"></div>\`;
  return \`<div class="fracbar">\${segs}</div>\`;
}

const app = document.getElementById('app');
const BEACH = ['ocean', 'aqua', 'coral', 'sand'];
let currentLevel = '4';

// ---------- Tutor explanations ----------
const TUTOR_NOTES = {${TUTOR_NOTES_G4}${TUTOR_NOTES_G6}${TUTOR_NOTES_G5}${TUTOR_NOTES_FP}
};
function tutorHTML(key) {
  return \`
    <div class="tutor-box">
      <button class="tutor-toggle" onclick="toggleTutor('\${key}')">For the tutor: what this is really practising</button>
      <div class="tutor-panel" id="tutor-\${key}">\${TUTOR_NOTES[key]}</div>
    </div>
  \`;
}
function toggleTutor(key) {
  const panel = document.getElementById('tutor-' + key);
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

// ---------- Activity registry ----------
${SECTIONS_BY_LEVEL}
const ACTIVITIES = {${ACTIVITIES_G4}${ACTIVITIES_G6}${ACTIVITIES_G5}${ACTIVITIES_FP}
};

function renderLevelTabs() {
  document.getElementById('level-tabs').innerHTML = Object.keys(LEVEL_LABELS).map(l =>
    \`<div class="level-tab \${currentLevel === l ? 'active' : ''}" onclick="setLevel('\${l}')">\${LEVEL_LABELS[l]}</div>\`
  ).join('');
}
function setLevel(l) { currentLevel = l; renderLevelTabs(); renderHome(); window.scrollTo(0, 0); }

function renderHome() {
  renderLevelTabs();
  let html = '';
  SECTIONS_BY_LEVEL[currentLevel].forEach(sec => {
    html += \`<div class="section-heading">\${sec.title}</div><div class="grid">\`;
    sec.keys.forEach((key, i) => {
      const a = ACTIVITIES[key];
      const c = BEACH[i % BEACH.length];
      html += \`
        <div class="tile" style="--tile-color: var(--\${c}); --tile-bg: var(--\${c}-light);" onclick="goTo('\${key}')">
          <div class="dot">\${a.icon}</div>
          <div><h3>\${a.title}</h3><p>\${a.desc}</p>\${a.badge ? \`<div class="badge">\${a.badge}</div>\` : ''}</div>
        </div>
      \`;
    });
    html += \`</div>\`;
  });
  app.innerHTML = html;
}

function backBtn() {
  return \`<button class="backbtn" onclick="goTo('home')">&#8592; All activities</button>\`;
}
function levelNote(a) {
  return a.badge ? \`<div class="levelnote">\${a.badge}</div>\` : '';
}
function scoreHTML(state) {
  return \`<span class="scorepill">Score: \${state.correct} of \${state.attempted}</span>\`;
}

function goTo(key) {
  if (key === 'home') { renderHome(); return; }
${BUILDERS_MAP}
  window.scrollTo(0, 0);
  builders[key]();
}
`;

const INIT = `
// ---------- init ----------
renderHome();
</script>
</body>
</html>
`;

const finalHTML = HEAD + UTILITIES + '\n' + fpBody + '\n' + g4Body + '\n' + g5Body + '\n' + g6Body + '\n' + INIT;
fs.writeFileSync(OUT, finalHTML);
console.log('Wrote', OUT, finalHTML.length, 'chars');
