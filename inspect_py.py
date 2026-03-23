with open(r"c:\Users\gagum\Downloads\소상공인시장진흥공단_상가(상권)정보_20251231\711_DT_M0105Y_2020_M_20260323215448.csv", "r", encoding="euc-kr", errors="ignore") as f:
    for i in range(5):
        print(repr(f.readline()))
