
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Svg, Polygon, Line, Circle } from '@react-pdf/renderer';
import { registerPdfFonts } from '@/lib/pdfFonts';

registerPdfFonts();

const COLORS = {
    navy: '#153749',
    orange: '#F05324',
    teal: '#049978',
    yellow: '#F0B91C',
    gray: '#f3f4f6',
    text: '#374151'
};

// --- 2. RADAR CHART DRAWING (Improved) ---
const drawRadarChart = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const size = 300; // Increased size
    const center = size / 2;
    const radius = 100;
    const totalPoints = data.length;
    const angleStep = (Math.PI * 2) / totalPoints;

    const getCoords = (val: number, i: number, max: number) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = (val / max) * radius;
        return { x: center + Math.cos(angle) * r, y: center + Math.sin(angle) * r };
    };

    // Draw Grid (Levels 1-5)
    const gridEls = [1, 2, 3, 4, 5].map(level => {
        const points = data.map((_, i) => {
            const { x, y } = getCoords(level, i, 5);
            return `${x},${y}`;
        }).join(' ');
        return <Polygon key={`grid-${level}`} points={points} stroke="#e5e7eb" strokeWidth={1} fill="none" />;
    });

    // Draw Axes & Labels
    const axesEls = data.map((d: any, i: number) => {
        const edge = getCoords(5, i, 5);
        const angle = i * angleStep - Math.PI / 2;
        // Label positioning logic
        const labelX = center + Math.cos(angle) * (radius + 25);
        const labelY = center + Math.sin(angle) * (radius + 10);

        return (
            <React.Fragment key={`axis-${i}`}>
                <Line x1={center} y1={center} x2={edge.x} y2={edge.y} stroke="#e5e7eb" strokeWidth={1} />
                <Text
                    x={labelX - 25}
                    y={labelY}
                    style={{ fontSize: 8, width: 50, textAlign: 'center', fontFamily: 'BPG Glaho', color: COLORS.navy }}
                >
                    {d.subject}
                </Text>
            </React.Fragment>
        );
    });

    // Draw Data Shape
    const dataPoints = data.map((d: any, i: number) => {
        const val = Number(d.A) || 0;
        const { x, y } = getCoords(val, i, 5);
        return `${x},${y}`;
    }).join(' ');

    return (
        <View style={{ width: size, height: size, alignSelf: 'center', marginVertical: 20 }}>
            <Svg width={size} height={size}>
                {gridEls}
                {axesEls}
                <Polygon points={dataPoints} fill={COLORS.orange} fillOpacity={0.2} stroke={COLORS.orange} strokeWidth={2} />
                {data.map((d: any, i: number) => {
                    const { x, y } = getCoords(Number(d.A) || 0, i, 5);
                    return <Circle key={i} cx={x} cy={y} r={3} fill={COLORS.orange} />;
                })}
            </Svg>
        </View>
    );
};

// --- 3. STYLES ---
const styles = StyleSheet.create({
    page: { fontFamily: 'BPG Glaho', paddingBottom: 40, backgroundColor: '#FFFFFF' },

    // Header
    header: { backgroundColor: COLORS.navy, padding: 30, color: 'white' },
    headerLabel: { fontFamily: 'BPG Glaho Bold', fontSize: 10, opacity: 0.8, marginBottom: 5, color: COLORS.orange },
    headerTitle: { fontFamily: 'BPG Glaho Caps', fontSize: 24, color: '#FFFFFF', marginBottom: 5 },
    headerSubtitle: { fontFamily: 'BPG Glaho Caps', fontSize: 14, color: COLORS.teal },

    // Meta Box (Score & Company)
    metaBox: { flexDirection: 'row', marginTop: 15, gap: 20 },
    metaItem: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 4, minWidth: 100 },
    metaLabel: { fontSize: 8, opacity: 0.7, marginBottom: 2, fontFamily: 'BPG Glaho' },
    metaValue: { fontSize: 12, fontWeight: 'bold', fontFamily: 'BPG Glaho' },

    // Sections
    section: { paddingHorizontal: 30, paddingVertical: 15 },
    sectionTitle: {
        fontFamily: 'BPG Glaho Caps',
        fontSize: 18,
        color: COLORS.orange,
        marginBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#f3f4f6',
        paddingBottom: 5
    },

    // 3-Column Layout
    columnContainer: { flexDirection: 'row', gap: 10, marginTop: 10 },
    columnBox: { flex: 1, padding: 10, borderRadius: 4 },
    colOrange: { backgroundColor: COLORS.orange, color: 'white' },
    colNavy: { backgroundColor: COLORS.navy, color: 'white' },
    colTeal: { backgroundColor: COLORS.teal, color: 'white' },

    colTitle: {
        fontFamily: 'BPG Glaho Caps',
        fontSize: 10,
        marginBottom: 8,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
        paddingBottom: 4
    },
    colText: { fontSize: 8, lineHeight: 1.4, marginBottom: 4, fontFamily: 'BPG Glaho' },

    // Meaning Grid
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridItem: { width: '31%', backgroundColor: '#f9fafb', padding: 10, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: COLORS.teal },
    gridTitle: { fontSize: 9, fontWeight: 'bold', color: COLORS.navy, marginBottom: 3, fontFamily: 'BPG Glaho Caps' },
    gridDesc: { fontSize: 8, color: COLORS.text, fontFamily: 'BPG Glaho' },

    // Essence & Focus Boxes
    dualBoxContainer: { flexDirection: 'row', gap: 15, marginBottom: 20, paddingHorizontal: 30 },
    essenceBox: { flex: 1, backgroundColor: '#fff7ed', padding: 15, borderRadius: 6, borderLeftWidth: 4, borderLeftColor: COLORS.orange },
    focusBox: { flex: 1, backgroundColor: '#f0fdf4', padding: 15, borderRadius: 6, borderLeftWidth: 4, borderLeftColor: COLORS.teal },
    boxTitle: { fontFamily: 'BPG Glaho Caps', fontSize: 10, marginBottom: 5, fontWeight: 'bold' },
    boxText: { fontFamily: 'BPG Glaho', fontSize: 9, lineHeight: 1.4, color: COLORS.text },

    footer: { position: 'absolute', bottom: 20, left: 30, right: 30, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#9ca3af', fontFamily: 'BPG Glaho' }
});

// --- 4. DOCUMENT COMPONENT ---
const ReportDocument = ({ data }: any) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerLabel}>ბიზნეს პროცესების სიმწიფის შეფასება</Text>
                <Text style={styles.headerTitle}>ფაზა {data.phaseId}: {data.phaseConfig.title}</Text>
                <Text style={styles.headerSubtitle}>{data.phaseConfig.subtitle}</Text>

                {/* FIX: Apply explicit font style here */}
                <Text style={{
                    fontSize: 10,
                    marginTop: 10,
                    opacity: 0.9,
                    color: '#FFFFFF',
                    fontFamily: 'BPG Glaho Caps', // <--- UPDATED TO CAPS
                    textAlign: 'center'
                }}>
                    {data.phaseConfig.essence || "აღწერა არ არის"}
                </Text>

                <View style={styles.metaBox}>
                    <View style={styles.metaItem}>
                        <Text style={{ ...styles.metaLabel, fontFamily: 'BPG Glaho' }}>ორგანიზაცია</Text>
                        <Text style={{ ...styles.metaValue, fontFamily: 'BPG Glaho' }}>{data.companyName || "N/A"}</Text>
                    </View>
                    <View style={{ ...styles.metaItem, backgroundColor: COLORS.orange }}>
                        <Text style={{ ...styles.metaLabel, fontFamily: 'BPG Glaho', color: 'white' }}>ქულა</Text>
                        <Text style={{ ...styles.metaValue, fontFamily: 'BPG Glaho', color: 'white' }}>{Number(data.score).toFixed(2)} / 5.0</Text>
                    </View>
                </View>

                {/* Metadata Line */}
                <Text style={{ fontSize: 10, marginTop: 5, fontFamily: 'BPG Glaho', color: '#FFFFFF', opacity: 0.8 }}>
                    ორგანიზაცია: {data.companyName} | ქულა: {Number(data.score).toFixed(2)}
                </Text>
            </View>

            {/* RADAR CHART */}
            <View style={styles.section} wrap={false}>
                <Text style={styles.sectionTitle}>შეფასების ვიზუალიზაცია</Text>
                {drawRadarChart(data.radarData)}
            </View>

            {/* ESSENCE & FOCUS */}
            <View style={styles.dualBoxContainer} wrap={false}>
                <View style={styles.essenceBox}>
                    <Text style={{ ...styles.boxTitle, color: COLORS.orange }}>არსი (Essence)</Text>
                    <Text style={styles.boxText}>{data.phaseConfig.essence}</Text>
                </View>
                <View style={styles.focusBox}>
                    <Text style={{ ...styles.boxTitle, color: COLORS.teal }}>ფოკუსი (Focus)</Text>
                    <Text style={styles.boxText}>{data.phaseConfig.focus}</Text>
                </View>
            </View>

            {/* SECTION 1: WHAT IT MEANS (Grid) */}
            <View style={styles.section} wrap={false}>
                <Text style={styles.sectionTitle}>რას ნიშნავს ფაზა {data.phaseId}</Text>
                <View style={styles.gridContainer}>
                    {data.phaseConfig.meaningPoints?.map((p: any, i: number) => (
                        <View key={i} style={styles.gridItem} wrap={false}>
                            <Text style={styles.gridTitle}>{p.title}</Text>
                            <Text style={styles.gridDesc}>{p.desc}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* SECTION 2: MANIFESTATION (3 Columns) */}
            <View style={styles.section} wrap={false}>
                <Text style={styles.sectionTitle}>როგორ ვლინდება ეს</Text>
                <View style={styles.columnContainer}>
                    {/* Strategy Column */}
                    <View style={[styles.columnBox, styles.colOrange]} wrap={false}>
                        <Text style={styles.colTitle}>სტრატეგია</Text>
                        {data.phaseConfig.manifestation?.strategy?.map((item: string, i: number) => (
                            <Text key={i} style={styles.colText}>• {item}</Text>
                        ))}
                    </View>
                    {/* Leadership Column */}
                    <View style={[styles.columnBox, styles.colNavy]} wrap={false}>
                        <Text style={styles.colTitle}>ლიდერობა</Text>
                        {data.phaseConfig.manifestation?.leadership?.map((item: string, i: number) => (
                            <Text key={i} style={styles.colText}>• {item}</Text>
                        ))}
                    </View>
                    {/* Processes Column */}
                    <View style={[styles.columnBox, styles.colTeal]} wrap={false}>
                        <Text style={styles.colTitle}>პროცესები</Text>
                        {data.phaseConfig.manifestation?.processes?.map((item: string, i: number) => (
                            <Text key={i} style={styles.colText}>• {item}</Text>
                        ))}
                    </View>
                </View>
            </View>

            {/* SECTION 3: CHALLENGES */}
            <View style={styles.section} wrap={false}>
                <Text style={styles.sectionTitle}>ტიპური გამოწვევები</Text>
                {data.phaseConfig.challenges?.map((c: any, i: number) => (
                    <View key={i} style={{ marginBottom: 8, flexDirection: 'row' }} wrap={false}>
                        <Text style={{ color: COLORS.orange, marginRight: 5, fontSize: 10 }}>⚠</Text>
                        <View>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.navy }}>{c.title}</Text>
                            <Text style={{ fontSize: 8, color: COLORS.text }}>{c.desc}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* SECTION 4: COMMUNICATION (independent scoring system) */}
            {data.communication && data.communication.count > 0 && (
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>კომუნიკაცია</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ ...styles.metaItem, backgroundColor: COLORS.teal }}>
                            <Text style={{ ...styles.metaLabel, fontFamily: 'BPG Glaho', color: 'white' }}>საშუალო ქულა</Text>
                            <Text style={{ ...styles.metaValue, fontFamily: 'BPG Glaho', color: 'white' }}>
                                {Number(data.communication.overallAverage).toFixed(2)} / 7.0
                            </Text>
                        </View>
                    </View>
                    {Object.entries(data.communication.byConstruct || {}).map(([key, bucket]: [string, any]) => (
                        <View key={key} style={{ marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' }} wrap={false}>
                            <Text style={{ fontSize: 9, color: COLORS.navy }}>{key}</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.teal }}>{Number(bucket.average).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* FOOTER */}
            <Text style={styles.footer}>
                <Text>GEC - Business Growth Services</Text>
            </Text>
        </Page>
    </Document>
);

export default ReportDocument;
