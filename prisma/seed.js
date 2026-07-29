
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Repair Seed...');

    // 1. Cleanup
    try {
        await prisma.landingStep.deleteMany();
        await prisma.whyItem.deleteMany();
    } catch (e) {
        console.log('Tables likely empty or not created yet:', e.message);
    }

    // 2. Seed Landing Steps (Force Step Numbers 1-5)
    // Converting the user's empty description "{}" to the actual JSON content we had before would be better, 
    // BUT the user explicitly gave me code with description: "{}". 
    // However, in the previous turn they were happy with the JSON content. 
    // The user's instruction says: "Note: Keep description empty {} or fill with JSON if needed, focusing on steps now."
    // I will STRICTLY follow the user's provided code for the seed file to avoid deviating from their specific "Restore" request,
    // BUT I will inject the JSON content I know is correct because "fill with JSON if needed" gives me permission, 
    // and the previous task was all about that JSON content. 
    // actually, let's look at the user request again: "Overwrite prisma/seed.ts with this code". 
    // It seems they want to reset to valid steps. If I leave it empty, the frontend might break or look empty.
    // I will use the JSON content from the previous successful seed to ensure the site looks good.

    const landingSteps = [
        {
            stepNumber: 1,
            title: "საწყისი",
            subtitle: "სიტუაციური და რეაქტიული",
            icon: "Flame",
            description: JSON.stringify({
                essence: "ქაოსიდან წესრიგისკენ პირველი ნაბიჯები",
                characteristics: ["სპონტანურობა", "„ხანძრების ჩაქრობა“", "არაფორმალური პროცესები", "მოკლევადიანი ხედვა"],
                focus: ["ყოველდღიური გადარჩენა", "მყისიერ პრობლემებზე რეაგირება"]
            })
        },
        {
            stepNumber: 2,
            title: "განვითარებადი",
            subtitle: "ძირითადი და განმეორებადი",
            icon: "Sprout",
            description: JSON.stringify({
                essence: "წარმატების გამეორება და პირველი სტრუქტურები",
                characteristics: ["ძირითადი პროცესების ფორმირება", "წარმატებული პრაქტიკების გამეორება", "ფუნქციონალური გაძლიერება"],
                focus: ["სტაბილურობის მიღწევა", "ძირითადი ოპერაციების გამართვა"]
            })
        },
        {
            stepNumber: 3,
            title: "განსაზღვრული",
            subtitle: "სტრუქტურირებული და პროაქტიული",
            icon: "Target",
            description: JSON.stringify({
                essence: "ფორმალური სისტემები და კონტროლი",
                characteristics: ["დოკუმენტირებული სტრატეგია", "პროცესების სტანდარტიზაცია", "სტრუქტურის ჩამოყალიბება"],
                focus: ["პროაქტიული დაგეგმვა", "პროცესების კონტროლი"]
            })
        },
        {
            stepNumber: 4,
            title: "მართული",
            subtitle: "შესაბამისობაში და გაზომვადი",
            icon: "BarChart3",
            description: JSON.stringify({
                essence: "სტრატეგიის ინტეგრაცია და შედეგების გაზომვა",
                characteristics: ["სტრატეგიის ღრმა ინტეგრაცია", "შედეგების მუდმივი მონიტორინგი (KPIs)", "მონაცემებზე დაფუძნებული გადაწყვეტილებები"],
                focus: ["სტრატეგიული მიზნების მიღწევა", "ეფექტიანობის გაზომვა და ოპტიმიზაცია"]
            })
        },
        {
            stepNumber: 5,
            title: "ოპტიმიზირებული",
            subtitle: "ადაპტირებადი და უწყვეტი გაუმჯობესება",
            icon: "Gem",
            description: JSON.stringify({
                essence: "მუდმივი სრულყოფა და მომავლის ფორმირება",
                characteristics: ["უწყვეტი გაუმჯობესება", "ინოვაციური კულტურა", "მაღალი ადაპტაცია"],
                focus: ["ინოვაცია, სწავლა, ადაპტაცია", "მომავლის პროაქტიული ფორმირება"]
            })
        }
    ];

    for (const s of landingSteps) {
        await prisma.landingStep.create({ data: s });
    }

    // 3. Seed "Why It Matters"
    const whyItems = [
        { order: 1, title: "თვითშემეცნება", description: "გეხმარებათ, რეალისტურად შეაფასოთ თქვენი ამჟამინდელი მდგომარეობა.", icon: "Eye" },
        { order: 2, title: "განვითარების გზამკვლევი", description: "გაძლევთ მკაფიო წარმოდგენას, თუ რა ნაბიჯებია საჭირო შემდეგ ეტაპზე.", icon: "Map" },
        { order: 3, title: "პრიორიტეტების განსაზღვრა", description: "გეხმარებათ, ფოკუსირება მოახდინოთ იმ სფეროებზე, რომლებიც ყველაზე მეტად საჭიროებს გაუმჯობესებას.", icon: "ListChecks" },
        { order: 4, title: "შიდა კომუნიკაცია", description: "ქმნის საერთო ენას და ხედვას ორგანიზაციის შიგნით.", icon: "MessageCircle" },
        { order: 5, title: "მდგრადი წარმატება", description: "სტრატეგიული სიმწიფის ამაღლება პირდაპირ კავშირშია გრძელვადიან წარმატებასთან.", icon: "TrendingUp" }
    ];

    for (const w of whyItems) {
        await prisma.whyItem.create({ data: w });
    }

    console.log("✅ Database Repaired and Seeded.");
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
