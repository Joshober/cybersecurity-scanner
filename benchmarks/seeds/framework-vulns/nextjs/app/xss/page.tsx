export default function Page(props) {
  const html = props.searchParams?.h ?? "";
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
