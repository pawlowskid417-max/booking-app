async function main() {
  const res = await fetch('http://localhost:3000/api/availability?employeeId=cmt677zww0002t0txi4mobqgp&serviceId=cmt671yus0001t0txp1z5v6k7');
  const data = await res.json();
  console.log(data);
}
main();
