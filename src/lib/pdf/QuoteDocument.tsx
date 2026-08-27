import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface QuotePdfLineItem {
  productTitle: string;
  variantTitle: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface QuoteDocumentProps {
  companyName: string;
  tierName: string;
  quoteDate: string; // pre-formatted, e.g. "24 Aug 2026"
  validUntil: string; // pre-formatted
  items: QuotePdfLineItem[];
  grandTotal: number;
}

const BRAND_COLOR = "#4a2c17"; // chocolate brown
const ACCENT_COLOR = "#b8862f"; // gold accent

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    borderBottom: `2 solid ${BRAND_COLOR}`,
    paddingBottom: 16,
  },
  brandBlock: { flexDirection: "column" },
  brand: { fontSize: 20, fontWeight: 700, color: BRAND_COLOR },
  tagline: { marginTop: 3, fontSize: 9, color: ACCENT_COLOR, textTransform: "uppercase", letterSpacing: 1 },
  meta: { textAlign: "right", color: "#555" },
  metaLabel: { fontSize: 9, color: "#888" },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 9, color: "#888", marginBottom: 2 },
  sectionValue: { fontSize: 12, fontWeight: 700, color: BRAND_COLOR },
  table: { marginTop: 12 },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f7f2ec",
    borderBottom: `1 solid ${BRAND_COLOR}`,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5 solid #ddd",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRowAlt: { backgroundColor: "#fbf9f6" },
  colProduct: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 1.2, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right" },
  headerText: { fontSize: 9, color: "#888", textTransform: "uppercase" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    paddingTop: 12,
    borderTop: `2 solid ${BRAND_COLOR}`,
  },
  totalLabel: { fontSize: 12, marginRight: 12, color: "#555" },
  totalValue: { fontSize: 14, fontWeight: 700, color: BRAND_COLOR },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTop: "0.5 solid #ddd",
    paddingTop: 8,
  },
  footerText: { flex: 1, fontSize: 8, color: "#999" },
  pageNumber: { fontSize: 8, color: "#999", marginLeft: 12 },
});

const fmt = (n: number) => `$${n.toFixed(2)}`;

export function QuoteDocument({
  companyName,
  tierName,
  quoteDate,
  validUntil,
  items,
  grandTotal,
}: QuoteDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>Kakawa Chocolates</Text>
            <Text style={styles.tagline}>Wholesale &amp; Corporate Quote</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Quote date</Text>
            <Text>{quoteDate}</Text>
            <Text style={[styles.metaLabel, { marginTop: 6 }]}>Valid until</Text>
            <Text>{validUntil}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Prepared for</Text>
            <Text style={styles.sectionValue}>{companyName}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pricing tier</Text>
            <Text style={styles.sectionValue}>{tierName}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colProduct, styles.headerText]}>Product</Text>
            <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
            <Text style={[styles.colUnit, styles.headerText]}>Unit price</Text>
            <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
          </View>
          {items.map((item, i) => (
            <View
              key={i}
              style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
            >
              <Text style={styles.colProduct}>
                {item.productTitle}
                {item.variantTitle ? ` — ${item.variantTitle}` : ""}
              </Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{fmt(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{fmt(item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand total</Text>
          <Text style={styles.totalValue}>{fmt(grandTotal)}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            This is a wholesale/corporate pricing quote generated via the Kakawa
            B2B portal. Prices reflect your assigned pricing tier and any
            applicable volume discounts at time of generation and are not a
            confirmed order. Contact Kakawa to convert this quote into an order.
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
