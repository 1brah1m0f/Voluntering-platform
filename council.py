import argparse, json, os, re, shutil, subprocess, sys, time
from pathlib import Path

AGENTS = {'claude':['claude','-p','--output-format','text','--permission-mode','acceptEdits'], 'codex':['codex','exec','--full-auto'], 'gemini':['gemini','-p']}

def run(cmd,cwd=None,timeout=900,check=True):
    p=subprocess.run(cmd,cwd=cwd,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,encoding='utf-8',errors='replace',timeout=timeout)
    if check and p.returncode: raise RuntimeError(f"{' '.join(cmd)}\n{p.stderr[-2500:]}\n{p.stdout[-1000:]}")
    return p

def git(repo,*args): return run(['git','-C',str(repo),*args]).stdout.strip()

def invoke(agent,prompt,cwd,timeout):
    cmd=AGENTS[agent].copy()
    if agent=='gemini': cmd += [prompt,'--yolo']
    else: cmd += [prompt]
    return run(cmd,cwd,timeout=timeout,check=False)

def main():
    ap=argparse.ArgumentParser(description='Collaborative CLI coding council: Claude, Codex, Gemini')
    ap.add_argument('--repo',default='.')
    ap.add_argument('--task',required=True)
    ap.add_argument('--rounds',type=int,default=2)
    ap.add_argument('--timeout',type=int,default=900)
    ap.add_argument('--apply',action='store_true',help='Allow autonomous edits in isolated worktrees after debate')
    args=ap.parse_args()
    if args.rounds<1 or args.rounds>6: ap.error('rounds must be 1..6')
    repo=Path(git(Path(args.repo),'rev-parse','--show-toplevel')).resolve()
    if git(repo,'status','--porcelain'): sys.exit('Repository has uncommitted changes. Commit/stash them before starting.')
    missing=[a for a in AGENTS if not shutil.which(AGENTS[a][0])]
    if missing: sys.exit('Missing CLI executables: '+', '.join(missing))
    stamp=time.strftime('%Y%m%d-%H%M%S')
    output=repo.parent/f'{repo.name}-council-{stamp}'
    output.mkdir()
    base=git(repo,'rev-parse','HEAD')
    history=[]
    worktrees={}
    try:
        for agent in AGENTS:
            branch=f'council/{stamp}/{agent}'
            path=output/agent
            git(repo,'worktree','add','-b',branch,str(path),base)
            worktrees[agent]=(path,branch)
        for rnd in range(1,args.rounds+1):
            # Sequential deliberation, but each agent sees all previous contributions.
            for agent in AGENTS:
                path,_=worktrees[agent]
                recent='\n\n'.join(f"ROUND {h['round']} - {h['agent']}:\n{h['response'][:6000]}" for h in history[-6:])
                prompt=(f'You are {agent} on a three-agent software engineering council.\n'
                    f'Project task: {args.task}\n'
                    'Inspect the repository locally. Debate concrete engineering options with other agents. '
                    'Challenge unsupported claims; mention file paths and risks. '
                    'Do not modify any files during deliberation. Do not run destructive commands. '
                    'Respond with findings, rebuttals, and proposed next steps.\n'
                    f'Previous discussion:\n{recent or "No prior messages."}')
                print(f'\n=== Round {rnd}: {agent} ===',flush=True)
                result=invoke(agent,prompt,path,args.timeout)
                response=(result.stdout or result.stderr).strip()
                history.append({'round':rnd,'agent':agent,'exit_code':result.returncode,'response':response})
                (output/'discussion.json').write_text(json.dumps(history,ensure_ascii=False,indent=2),encoding='utf-8')
                print(response[:2000],flush=True)
                # Deliberation must not change tracked or untracked files.
                if git(path,'status','--porcelain'):
                    sys.exit(f'{agent} modified files during discussion in {path}. Review manually; worktrees retained.')
        if args.apply:
            debate='\n\n'.join(f"{h['agent']}: {h['response'][:5000]}" for h in history[-6:])
            for agent in AGENTS:
                path,branch=worktrees[agent]
                prompt=(f'Implement the task in this isolated branch: {args.task}\n'
                    'Use the shared council discussion below. Make safe, focused code changes and run relevant tests. '
                    'Do not push, merge, delete files unrelated to the task, or access secrets. '
                    'Your working tree is isolated from the other agents.\n'+debate)
                print(f'\n=== Implementing: {agent} ===',flush=True)
                result=invoke(agent,prompt,path,args.timeout)
                (output/f'{agent}-implementation.log').write_text(result.stdout+'\nSTDERR:\n'+result.stderr,encoding='utf-8')
                changes=git(path,'status','--porcelain')
                if changes:
                    git(path,'add','-A')
                    git(path,'-c','user.name=AI Council','-c','user.email=ai-council@localhost','commit','-m',f'council: {agent} implementation')
                print(f'{agent}: exit={result.returncode}, branch={branch}, changes={bool(changes)}')
        lines=['# AI Council Results','',f'Base commit: `{base}`','',f'Task: {args.task}','', '## Branches']
        for agent,(path,branch) in worktrees.items():
            lines += [f'- {agent}: `{branch}` at `{path}`']
        lines+=['','## Comparison']
        for agent,(path,branch) in worktrees.items():
            diff=run(['git','-C',str(path),'diff','--stat',base,'HEAD']).stdout.strip()
            lines += [f'### {agent}', '```',diff or '(no committed changes)','```']
        lines+=['','Review each branch and run tests before merging. No branch was pushed or merged.']
        (output/'REPORT.md').write_text('\n'.join(lines),encoding='utf-8')
        print(f'\nDone. Report: {output / "REPORT.md"}')
    except (RuntimeError,subprocess.TimeoutExpired) as exc:
        print(f'ERROR: {exc}\nWorktrees retained in {output}',file=sys.stderr)
        sys.exit(1)

if __name__=='__main__': main()
